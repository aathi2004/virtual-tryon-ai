"""
VirtualFit AI service.

Endpoints:
  GET  /health  -> {"status": "ok"}
  POST /pose    -> existing pose detection (kept for compatibility)
  POST /tryon   -> AI try-on composite using MediaPipe Tasks
                   (PoseLandmarker + ImageSegmenter) and OpenCV warp + alpha blend.

Run:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import base64
import os
import urllib.request
from pathlib import Path

import cv2
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

app = FastAPI(title="VirtualFit AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

POSE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)
SEG_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/"
    "selfie_segmenter/float16/1/selfie_segmenter.tflite"
)


def _download(url: str, dest: Path):
    if dest.exists() and dest.stat().st_size > 1024:
        return
    print(f"Downloading {url} -> {dest}")
    urllib.request.urlretrieve(url, dest)
    print(f"  done ({dest.stat().st_size / 1024:.1f} KB)")


_pose_path = MODEL_DIR / "pose_landmarker.task"
_seg_path = MODEL_DIR / "selfie_segmenter.tflite"
_download(POSE_MODEL_URL, _pose_path)
_download(SEG_MODEL_URL, _seg_path)


_pose_landmarker = mp_vision.PoseLandmarker.create_from_options(
    mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(_pose_path)),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
)

_segmenter = mp_vision.ImageSegmenter.create_from_options(
    mp_vision.ImageSegmenterOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(_seg_path)),
        running_mode=mp_vision.RunningMode.IMAGE,
        output_category_mask=False,
        output_confidence_masks=True,
    )
)


SIZE_SCALE = {
    "S": 0.92, "M": 0.96, "L": 1.0, "XL": 1.05,
    "XXL": 1.10, "XXXL": 1.15, "XXXXL": 1.20,
}


def _strip_data_url(s: str) -> bytes:
    if "," in s:
        s = s.split(",", 1)[1]
    return base64.b64decode(s)


def _decode_bgr(s: str):
    arr = np.frombuffer(_strip_data_url(s), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _decode_unchanged(s: str):
    arr = np.frombuffer(_strip_data_url(s), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)


def _encode_jpeg_b64(bgr) -> str:
    ok, buf = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    if not ok:
        raise RuntimeError("JPEG encode failed")
    return base64.b64encode(buf.tobytes()).decode("ascii")


def _to_mp_image(bgr):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)


def _detect_keypoints(person_bgr):
    h, w = person_bgr.shape[:2]
    res = _pose_landmarker.detect(_to_mp_image(person_bgr))
    if not res.pose_landmarks:
        return None
    lm = res.pose_landmarks[0]
    return {
        "ls": (lm[11].x * w, lm[11].y * h),
        "rs": (lm[12].x * w, lm[12].y * h),
        "lh": (lm[23].x * w, lm[23].y * h),
        "rh": (lm[24].x * w, lm[24].y * h),
        "vis": min(lm[11].visibility, lm[12].visibility,
                   lm[23].visibility, lm[24].visibility),
    }


def _segment_person(person_bgr):
    res = _segmenter.segment(_to_mp_image(person_bgr))
    if not res.confidence_masks:
        return None
    mask = res.confidence_masks[0].numpy_view()
    mask = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
    return cv2.GaussianBlur(mask, (9, 9), 0)


def _build_garment_alpha(garment_img):
    """Return BGRA garment with a clean alpha mask + crop pants from full-body suits.

    The frontend rasterises the garment onto a white background before sending
    it (the IDM-VTON 'white-canvas trick'), so we derive alpha from the white
    background here. Detects tall (suit-with-pants) images and crops to the
    upper jacket portion.
    """
    if garment_img is None:
        raise ValueError("Could not decode garment image")

    if garment_img.ndim == 3 and garment_img.shape[2] == 4:
        bgr = garment_img[:, :, :3]
        alpha = garment_img[:, :, 3]
        if alpha.min() > 250:
            alpha = None
    else:
        bgr = garment_img
        alpha = None

    if alpha is None:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, fg = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        kernel = np.ones((3, 3), np.uint8)
        fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, kernel, iterations=1)
        fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)
        alpha = cv2.GaussianBlur(fg, (7, 7), 0)

    h, w = alpha.shape[:2]
    if h > w * 1.35:
        crop_h = int(w * 1.25)
        bgr = bgr[:crop_h]
        alpha = alpha[:crop_h]

    return np.dstack([bgr, alpha])


def _warp_garment(garment_bgra, kp, person_shape, size_key="L"):
    h, w = person_shape[:2]
    gh, gw = garment_bgra.shape[:2]
    scale = SIZE_SCALE.get(size_key.upper(), 1.0)

    src = np.float32([
        [gw * 0.18, gh * 0.18],
        [gw * 0.82, gh * 0.18],
        [gw * 0.20, gh * 0.92],
        [gw * 0.80, gh * 0.92],
    ])

    ls = np.array(kp["ls"], dtype=np.float32)
    rs = np.array(kp["rs"], dtype=np.float32)
    lh = np.array(kp["lh"], dtype=np.float32)
    rh = np.array(kp["rh"], dtype=np.float32)

    shoulder_vec = rs - ls
    shoulder_w = float(np.linalg.norm(shoulder_vec))
    if shoulder_w < 8:
        return None

    shoulder_dir = shoulder_vec / shoulder_w
    perp = np.array([-shoulder_dir[1], shoulder_dir[0]], dtype=np.float32)

    pad = shoulder_w * 0.22 * scale
    lift = shoulder_w * 0.04
    drop = shoulder_w * 0.10 * scale

    p_ls = ls - shoulder_dir * pad - perp * lift
    p_rs = rs + shoulder_dir * pad - perp * lift
    p_lh = lh - shoulder_dir * pad * 0.45 + perp * drop
    p_rh = rh + shoulder_dir * pad * 0.45 + perp * drop

    dst = np.float32([p_ls, p_rs, p_lh, p_rh])

    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(
        garment_bgra, M, (w, h),
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
    return warped


def _composite(person_bgr, warped_bgra, person_mask=None):
    """Blend warped garment onto the person with feathered edges,
    a subtle drop-shadow at the neckline, and slight scene-color matching."""
    if warped_bgra is None:
        return person_bgr

    alpha = warped_bgra[:, :, 3].astype(np.float32) / 255.0

    if person_mask is not None:
        kernel = np.ones((9, 9), np.uint8)
        expanded = cv2.dilate(person_mask, kernel, iterations=2)
        expanded = cv2.GaussianBlur(expanded, (15, 15), 0)
        expanded_f = expanded.astype(np.float32) / 255.0
        alpha = alpha * expanded_f

    alpha = cv2.GaussianBlur(alpha, (9, 9), 0)
    alpha3 = np.dstack([alpha, alpha, alpha])

    fg = warped_bgra[:, :, :3].astype(np.float32)
    bg = person_bgr.astype(np.float32)

    person_mean = bg.reshape(-1, 3).mean(axis=0)
    person_lum = float(person_mean.mean())
    target_lum = 128.0
    lum_shift = (person_lum - target_lum) * 0.15
    fg = np.clip(fg + lum_shift, 0, 255)

    edge = np.abs(cv2.Sobel(alpha, cv2.CV_32F, 1, 0, ksize=3)) + np.abs(
        cv2.Sobel(alpha, cv2.CV_32F, 0, 1, ksize=3)
    )
    edge = np.clip(edge / (edge.max() + 1e-6), 0, 1)
    edge = cv2.GaussianBlur(edge, (15, 15), 0)
    shadow_strength = 0.18
    shadow3 = np.dstack([edge, edge, edge]) * shadow_strength
    bg = bg * (1.0 - shadow3)

    out = fg * alpha3 + bg * (1.0 - alpha3)
    out = np.clip(out, 0, 255).astype(np.uint8)

    out = cv2.bilateralFilter(out, 5, 30, 30)
    return out


class ImageInput(BaseModel):
    image: str


class TryOnInput(BaseModel):
    person_image: str
    garment_image: str
    size: str | None = "L"


@app.get("/health")
def health():
    return {"status": "ok", "service": "VirtualFit AI"}


@app.post("/pose")
def detect_pose(data: ImageInput):
    try:
        bgr = _decode_bgr(data.image)
        if bgr is None:
            return {"error": "Could not decode image"}
        h, w = bgr.shape[:2]
        res = _pose_landmarker.detect(_to_mp_image(bgr))
        if not res.pose_landmarks:
            return {"error": "No pose detected"}
        lm = res.pose_landmarks[0]

        def pt(i):
            return {"x": int(lm[i].x * w), "y": int(lm[i].y * h)}

        return {
            "left_shoulder": pt(11),
            "right_shoulder": pt(12),
            "left_hip": pt(23),
            "right_hip": pt(24),
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/tryon")
def tryon(data: TryOnInput):
    try:
        person_bgr = _decode_bgr(data.person_image)
        if person_bgr is None:
            return {"success": False, "error": "Could not decode person image"}

        garment_raw = _decode_unchanged(data.garment_image)
        garment_bgra = _build_garment_alpha(garment_raw)

        kp = _detect_keypoints(person_bgr)
        if kp is None:
            return {"success": False, "error": "No pose detected in photo. Stand in frame and try again."}
        if kp["vis"] < 0.3:
            return {"success": False, "error": "Pose visibility too low. Move closer to camera."}

        person_mask = _segment_person(person_bgr)
        warped = _warp_garment(garment_bgra, kp, person_bgr.shape, data.size or "L")
        if warped is None:
            return {"success": False, "error": "Shoulders too close together"}

        result_bgr = _composite(person_bgr, warped, person_mask)

        return {
            "success": True,
            "image": _encode_jpeg_b64(result_bgr),
            "size": data.size or "L",
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
