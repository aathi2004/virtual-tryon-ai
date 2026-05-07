# IDM-VTON on Colab T4 — VirtualFit Pro

Photorealistic virtual try-on using **IDM-VTON** (SDXL-based diffusion). Runs on a free Colab T4 GPU. Exposed to your local frontend via ngrok.

## Before you start

1. Open **Colab** → Runtime → Change runtime type → **T4 GPU** → Save
2. **Runtime → Restart runtime** (clean slate)
3. Get a free ngrok authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
4. Visit https://huggingface.co/yisol/IDM-VTON in a browser, click **Agree and access repository** (one-time per HF account)
5. Get a HF read token: https://huggingface.co/settings/tokens
6. Paste each cell below in order, run top-to-bottom.

---

## ▶ CELL 1 — Verify GPU & clone repo

```python
import os, sys
os.chdir('/content')

# Verify T4 / GPU is allocated
!nvidia-smi -L

# Clone IDM-VTON
if not os.path.exists('/content/IDM-VTON'):
    !git clone https://github.com/yisol/IDM-VTON.git
os.chdir('/content/IDM-VTON')

print("Repo:", os.getcwd())
```

Expected: `GPU 0: Tesla T4 (UUID: GPU-...)` and `Repo: /content/IDM-VTON`.

---

## ▶ CELL 2 — Install dependencies (minimal, reliable)

Uses Colab's pre-installed torch. Pins only what IDM-VTON's runtime imports actually need.

```python
import os; os.chdir('/content/IDM-VTON')

# 1. Use Colab's pre-installed torch (do NOT reinstall — version conflicts)
import torch
print(f"Pre-installed torch: {torch.__version__}")
print(f"CUDA available    : {torch.cuda.is_available()}")
print(f"CUDA version      : {torch.version.cuda}")
assert torch.cuda.is_available(), (
    "No GPU. Runtime → Change runtime type → T4 GPU → Save → Restart runtime"
)

# 2. CRITICAL: pin huggingface_hub FIRST (cached_download removed in 0.21+)
!pip install -q huggingface_hub==0.20.3

# 3. IDM-VTON's exact ML stack
!pip install -q diffusers==0.25.0 transformers==4.36.2 accelerate==0.25.0 peft==0.6.2

# 4. Light helper libs (pip picks compatible numpy/scipy)
!pip install -q einops==0.7.0 omegaconf==2.3.0
!pip install -q "pillow>=9.5,<11" opencv-python-headless==4.8.1.78
!pip install -q av==11.0.0 fvcore==0.1.5.post20221221 cloudpickle==3.0.0

# 5. Server + tunnel
!pip install -q flask==3.0.0 pyngrok==7.0.5

# 6. RE-pin huggingface_hub LAST in case anything bumped it
!pip install -q huggingface_hub==0.20.3 --force-reinstall --no-deps

# 7. Reload to make new versions take effect
import sys
for mod in list(sys.modules):
    if any(p in mod for p in
           ('huggingface', 'diffusers', 'transformers', 'accelerate', 'peft')):
        del sys.modules[mod]

# 8. Verify
import diffusers, transformers, huggingface_hub
print()
print(f"torch           : {torch.__version__}  cuda={torch.cuda.is_available()}")
print(f"diffusers       : {diffusers.__version__}")
print(f"transformers    : {transformers.__version__}")
print(f"huggingface_hub : {huggingface_hub.__version__}")
print(f"cached_download : {hasattr(huggingface_hub, 'cached_download')}")

assert hasattr(huggingface_hub, "cached_download"), (
    "cached_download missing — Runtime → Restart runtime, re-run cells in order."
)
print("\n✅ Stack OK")
```

---

## ▶ CELL 3 — Hugging Face login

The `yisol/IDM-VTON` repo is gated. You must accept its license once on the website (see step 4 in "Before you start"), then log in here with a token.

```python
from huggingface_hub import login

# Get a READ token from https://huggingface.co/settings/tokens
HF_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # <-- paste here
login(token=HF_TOKEN)

# Verify access
from huggingface_hub import HfApi
try:
    info = HfApi().repo_info("yisol/IDM-VTON")
    print(f"✅ Can access yisol/IDM-VTON ({len(info.siblings)} files)")
except Exception as e:
    print(f"❌ Still blocked: {e}")
    print("→ Visit https://huggingface.co/yisol/IDM-VTON and click 'Agree and access repository'")
```

---

## ▶ CELL 4 — Download IDM-VTON checkpoints (~6 GB, 2-4 min)

```python
import os; os.chdir('/content/IDM-VTON')
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="yisol/IDM-VTON",
    local_dir="ckpt",
    local_dir_use_symlinks=False,
    allow_patterns=[
        "densepose/*",
        "humanparsing/*",
        "openpose/ckpts/*",
        "image_encoder/*",
        "scheduler/*",
        "text_encoder/*",
        "text_encoder_2/*",
        "tokenizer/*",
        "tokenizer_2/*",
        "unet/*",
        "unet_encoder/*",
        "vae/*",
        "model_index.json",
    ],
)

print("\nDownloaded:")
!ls -lh ckpt | head -20
```

---

## ▶ CELL 5 — Load IDM-VTON pipeline (~90 sec)

```python
import os, sys
os.chdir('/content/IDM-VTON')
sys.path.insert(0, '/content/IDM-VTON')

import torch
from PIL import Image
import numpy as np
from torchvision import transforms
import torch.nn.functional as F

from src.tryon_pipeline import StableDiffusionXLInpaintPipeline as TryonPipeline
from src.unet_hacked_garmnet import UNet2DConditionModel as UNet2DConditionModel_ref
from src.unet_hacked_tryon import UNet2DConditionModel
from transformers import (
    CLIPImageProcessor,
    CLIPVisionModelWithProjection,
    CLIPTextModel,
    CLIPTextModelWithProjection,
    AutoTokenizer,
)
from diffusers import DDPMScheduler, AutoencoderKL
from preprocess.openpose.run_openpose import OpenPose
from preprocess.humanparsing.run_parsing import Parsing
from utils_mask import get_mask_location

BASE = "yisol/IDM-VTON"
DTYPE = torch.float16
DEVICE = "cuda"

print("Loading UNet (try-on)…")
unet = UNet2DConditionModel.from_pretrained(BASE, subfolder="unet", torch_dtype=DTYPE)
unet.requires_grad_(False)

print("Loading tokenizers…")
tokenizer_one = AutoTokenizer.from_pretrained(BASE, subfolder="tokenizer", revision=None, use_fast=False)
tokenizer_two = AutoTokenizer.from_pretrained(BASE, subfolder="tokenizer_2", revision=None, use_fast=False)

print("Loading text encoders…")
text_encoder_one = CLIPTextModel.from_pretrained(BASE, subfolder="text_encoder", torch_dtype=DTYPE)
text_encoder_two = CLIPTextModelWithProjection.from_pretrained(BASE, subfolder="text_encoder_2", torch_dtype=DTYPE)

print("Loading image encoder…")
image_encoder = CLIPVisionModelWithProjection.from_pretrained(BASE, subfolder="image_encoder", torch_dtype=DTYPE)

print("Loading VAE…")
vae = AutoencoderKL.from_pretrained(BASE, subfolder="vae", torch_dtype=DTYPE)

print("Loading garment UNet…")
unet_encoder = UNet2DConditionModel_ref.from_pretrained(BASE, subfolder="unet_encoder", torch_dtype=DTYPE)

scheduler = DDPMScheduler.from_pretrained(BASE, subfolder="scheduler")

for m in (unet, vae, unet_encoder, text_encoder_one, text_encoder_two, image_encoder):
    m.requires_grad_(False)

print("Building pipeline…")
pipe = TryonPipeline.from_pretrained(
    BASE,
    unet=unet,
    vae=vae,
    feature_extractor=CLIPImageProcessor(),
    text_encoder=text_encoder_one,
    text_encoder_2=text_encoder_two,
    tokenizer=tokenizer_one,
    tokenizer_2=tokenizer_two,
    scheduler=scheduler,
    image_encoder=image_encoder,
    torch_dtype=DTYPE,
)
pipe.unet_encoder = unet_encoder
pipe.to(DEVICE)
pipe.unet_encoder.to(DEVICE)

# Save VRAM if needed (slower but stays under 15 GB on T4)
# pipe.enable_model_cpu_offload()

print("Loading OpenPose + Human Parsing…")
openpose = OpenPose(0)
parsing  = Parsing(0)

print("\n✅ IDM-VTON ready on", torch.cuda.get_device_name(0))
print("VRAM used:", round(torch.cuda.memory_allocated()/1e9, 2), "GB")
```

---

## ▶ CELL 6 — Inference function + smoke test

Defines `run_tryon()` and runs it on the demo images bundled with IDM-VTON.

```python
import os, sys, base64, io, traceback, glob
sys.path.insert(0, '/content/IDM-VTON')

from PIL import Image
import numpy as np
import torch
from torchvision import transforms

# Pillow 10+ moved LANCZOS into Resampling enum
LANCZOS = getattr(Image, "Resampling", Image).LANCZOS

tensor_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5]),
])


def _b64_to_pil(s: str) -> Image.Image:
    if "," in s:
        s = s.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(s))).convert("RGB")


def _pil_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _resize_keep(img: Image.Image, target=(768, 1024)) -> Image.Image:
    return img.resize(target, LANCZOS)


@torch.inference_mode()
def run_tryon(person_b64: str, garment_b64: str,
              garment_desc: str = "upper body garment",
              denoise_steps: int = 30, seed: int = 42) -> str:
    person  = _resize_keep(_b64_to_pil(person_b64))
    garment = _resize_keep(_b64_to_pil(garment_b64))

    keypoints = openpose(np.array(person.resize((384, 512))))
    parse_img, _ = parsing(person.resize((384, 512)))
    mask, _ = get_mask_location("hd", "upper_body", parse_img, keypoints)
    mask = mask.resize((768, 1024))

    pose_img    = tensor_transform(person).unsqueeze(0).to(DEVICE, DTYPE)
    garm_tensor = tensor_transform(garment).unsqueeze(0).to(DEVICE, DTYPE)

    with torch.autocast(DEVICE):
        prompt     = f"model is wearing {garment_desc}"
        neg_prompt = "monochrome, lowres, bad anatomy, worst quality, low quality"

        (prompt_embeds, negative_prompt_embeds,
         pooled_prompt_embeds, negative_pooled_prompt_embeds) = pipe.encode_prompt(
            prompt, num_images_per_prompt=1,
            do_classifier_free_guidance=True, negative_prompt=neg_prompt,
        )
        prompt_c = f"a photo of {garment_desc}"
        (prompt_embeds_c, _, _, _) = pipe.encode_prompt(
            prompt_c, num_images_per_prompt=1,
            do_classifier_free_guidance=False, negative_prompt=neg_prompt,
        )

        generator = torch.Generator(DEVICE).manual_seed(seed)
        images = pipe(
            prompt_embeds=prompt_embeds,
            negative_prompt_embeds=negative_prompt_embeds,
            pooled_prompt_embeds=pooled_prompt_embeds,
            negative_pooled_prompt_embeds=negative_pooled_prompt_embeds,
            num_inference_steps=denoise_steps,
            generator=generator,
            strength=1.0,
            pose_img=pose_img,
            text_embeds_cloth=prompt_embeds_c,
            cloth=garm_tensor,
            mask_image=mask,
            image=person,
            height=1024, width=768,
            ip_adapter_image=garment.resize((768, 1024)),
            guidance_scale=2.0,
        )[0]

    torch.cuda.empty_cache()
    return _pil_to_b64(images[0])


# ---- Smoke test (won't crash function definition if it fails) ----
print("Smoke test…")
try:
    persons  = sorted(glob.glob("/content/IDM-VTON/example/human/*.jpg"))
    garments = sorted(glob.glob("/content/IDM-VTON/example/cloth/*.jpg"))
    if not persons or not garments:
        raise FileNotFoundError(
            f"No demo images. Found persons={len(persons)} garments={len(garments)}"
        )

    demo_person = Image.open(persons[0])
    demo_garm   = Image.open(garments[0])
    print(f"  using {persons[0]} + {garments[0]}")

    buf = io.BytesIO(); demo_person.save(buf, "JPEG"); pb64 = base64.b64encode(buf.getvalue()).decode()
    buf = io.BytesIO(); demo_garm.save(buf, "JPEG");   gb64 = base64.b64encode(buf.getvalue()).decode()

    out = run_tryon(pb64, gb64, "white t-shirt", denoise_steps=20)
    display(Image.open(io.BytesIO(base64.b64decode(out))))
    print("✅ Inference OK — run_tryon() is ready for the server cell.")
except Exception as e:
    print("⚠️  Smoke test failed (function still defined):")
    traceback.print_exc()
    print("\nIf only the smoke test failed, Cell 7 will still work with real images.")
```

---

## ▶ CELL 7 — Flask + ngrok with bulletproof CORS

**Replace `PASTE_YOUR_NGROK_TOKEN` with your token from <https://dashboard.ngrok.com/get-started/your-authtoken>**

```python
import os, sys, threading, time, traceback, urllib.request
sys.path.insert(0, '/content/IDM-VTON')

import torch
from flask import Flask, request, jsonify, make_response
from pyngrok import ngrok, conf

# === paste your ngrok authtoken here ===
NGROK_AUTHTOKEN = "PASTE_YOUR_NGROK_TOKEN"
assert NGROK_AUTHTOKEN and NGROK_AUTHTOKEN != "PASTE_YOUR_NGROK_TOKEN", (
    "Set NGROK_AUTHTOKEN. Get one at "
    "https://dashboard.ngrok.com/get-started/your-authtoken"
)

# Verify run_tryon was defined in Cell 6
try:
    run_tryon  # noqa: F821
except NameError:
    raise RuntimeError("run_tryon() is not defined. Run Cell 6 first.")

conf.get_default().auth_token = NGROK_AUTHTOKEN

# ---- Flask app ----
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB for base64 images


# ============================================================
#  CORS — manual, runs on EVERY request and response
# ============================================================
CORS_HEADERS = {
    "Access-Control-Allow-Origin":   "*",
    "Access-Control-Allow-Methods":  "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":  "*",
    "Access-Control-Expose-Headers": "*",
    "Access-Control-Max-Age":        "3600",
}

@app.before_request
def _handle_preflight():
    if request.method == "OPTIONS":
        resp = make_response("", 204)
        for k, v in CORS_HEADERS.items():
            resp.headers[k] = v
        return resp

@app.after_request
def _add_cors(resp):
    for k, v in CORS_HEADERS.items():
        resp.headers[k] = v
    resp.headers["ngrok-skip-browser-warning"] = "true"
    return resp


# ============================================================
#  Routes
# ============================================================
@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    return jsonify({
        "status": "ok",
        "service": "IDM-VTON",
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
        "vram_used_gb":  round(torch.cuda.memory_allocated() / 1e9, 2),
        "vram_total_gb": round(
            torch.cuda.get_device_properties(0).total_memory / 1e9, 2
        ) if torch.cuda.is_available() else 0,
    })


GARMENT_HINTS = {
    "men-suit":     "black formal suit jacket with white shirt and black tie",
    "women-suit":   "black formal blazer",
    "black-jacket": "black bomber jacket",
    "white-hoodie": "white pullover hoodie",
    "blue-shirt":   "blue button-up dress shirt",
    "green-shirt":  "olive green button-up shirt",
    "red-shirt":    "red button-up dress shirt",
}

def _hint_from_url(url: str) -> str:
    if not url:
        return "upper body garment"
    for key, desc in GARMENT_HINTS.items():
        if key in url:
            return desc
    return "upper body garment"


@app.route("/tryon", methods=["POST", "OPTIONS"])
def tryon_endpoint():
    if request.method == "OPTIONS":
        return ("", 204)
    t0 = time.time()
    try:
        data = request.get_json(force=True, silent=False)
        if not data:
            return jsonify({"success": False, "error": "Empty JSON body"}), 400

        person_b64  = data.get("person_image")
        garment_b64 = data.get("garment_image")
        if not person_b64 or not garment_b64:
            return jsonify({
                "success": False,
                "error": "Missing person_image or garment_image",
            }), 400

        size        = data.get("size", "L")
        garment_url = data.get("garment_url", "")
        desc        = data.get("garment_desc") or _hint_from_url(garment_url)

        print(f"[tryon] size={size}  desc={desc!r}", flush=True)

        result_b64 = run_tryon(
            person_b64, garment_b64,
            garment_desc=desc, denoise_steps=30,
        )

        torch.cuda.empty_cache()
        elapsed = round(time.time() - t0, 1)
        print(f"[tryon] done in {elapsed}s", flush=True)

        return jsonify({
            "success": True,
            "image":   result_b64,
            "size":    size,
            "model":   "IDM-VTON",
            "elapsed_sec": elapsed,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
#  Tear down old tunnels (safe if none exist)
# ============================================================
try:
    for t in ngrok.get_tunnels():
        try:
            ngrok.disconnect(t.public_url)
        except Exception:
            pass
    ngrok.kill()
except Exception:
    pass


# ============================================================
#  Open new ngrok tunnel
# ============================================================
try:
    public_url = ngrok.connect(5000, bind_tls=True).public_url
except Exception as e:
    raise RuntimeError(
        f"ngrok tunnel failed: {e}\n"
        "Common causes:\n"
        " 1. Bad NGROK_AUTHTOKEN — copy it again from the dashboard.\n"
        " 2. Account already has 2+ tunnels (free tier limit) — kill them at "
        "https://dashboard.ngrok.com/agents"
    )


# ============================================================
#  Start Flask in background thread
# ============================================================
_server_error = {"e": None}

def _run_server():
    try:
        app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    except Exception as e:
        _server_error["e"] = e
        traceback.print_exc()

threading.Thread(target=_run_server, daemon=True).start()


# ============================================================
#  Wait for server to actually accept connections
# ============================================================
print("Waiting for server to come up…")
for i in range(15):
    if _server_error["e"]:
        raise RuntimeError(f"Flask failed to start: {_server_error['e']}")
    time.sleep(1)
    try:
        with urllib.request.urlopen("http://127.0.0.1:5000/health", timeout=2) as r:
            if r.status == 200:
                break
    except Exception:
        continue
else:
    raise RuntimeError("Server did not respond within 15s. Check the traceback above.")

print("\n" + "=" * 70)
print("  🟢  IDM-VTON server LIVE")
print(f"  Paste this URL into the Setup Colab modal:")
print(f"     → {public_url}")
print("=" * 70)
print(f"\n  Test in browser first (clears ngrok warning):")
print(f"     → {public_url}/health")
print(f"\n  First request takes ~30s (kernel JIT). Subsequent: ~15s on T4.\n")
```

---

## After all 7 cells succeed

1. Cell 7 prints a fresh URL like `https://xxxxx.ngrok-free.app`.
2. Visit `<that URL>/health` once in your browser. Click **Visit Site** if you see the ngrok warning. You should see JSON like `{"status":"ok","device":"Tesla T4",...}`.
3. In your local app at **http://localhost:5173/try-on**:
   - Click **⚙️ Setup Colab**
   - Paste the ngrok URL
   - Click **Save & Test** → 🟢 green dot
4. Pick a garment, stand in frame, click **📸 Capture & Generate**.
5. Watch the Colab output for `[tryon] size=L desc='black formal suit...'` then `[tryon] done in 18.3s`.
6. Result modal appears with your photo + the AI try-on side-by-side. Download or try another.

---

## Troubleshooting

**Cell 2 errors with `Could not find version torch==...`** — the cell now uses Colab's pre-installed torch. Don't try to reinstall torch.

**Cell 3 `GatedRepoError` / `401`** — visit https://huggingface.co/yisol/IDM-VTON in a browser, click Agree and access repository. Re-run Cell 3.

**Cell 5 `cannot import name 'cached_download'`** — re-run Cell 2, then Restart runtime, then run all cells from Cell 1 again.

**Cell 6 `CUDA out of memory`** — uncomment `pipe.enable_model_cpu_offload()` in Cell 5.

**Cell 7 ngrok error `account has 1 active session limit`** — kill old tunnels at https://dashboard.ngrok.com/agents.

**Frontend shows red dot ("Colab Offline")** — Visit `<ngrok-url>/health` once in the browser to clear ngrok's interstitial. Then click Save & Test again.

**Each Cell 7 re-run prints a NEW URL** — Colab's free tier issues a fresh ngrok subdomain each time. Always paste the most recent URL.
