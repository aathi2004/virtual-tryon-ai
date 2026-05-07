import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { catalogFor, type Garment } from "../data/garments";

type SizeKey = "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | "XXXXL";

const sizes: SizeKey[] = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];

const sizeScaleMap: Record<SizeKey, number> = {
  S: 0.75,
  M: 0.87,
  L: 1.0,
  XL: 1.15,
  XXL: 1.3,
  XXXL: 1.45,
  XXXXL: 1.6,
};

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

interface BackendGarment {
  _id: string;
  name: string;
  category?: string;
  gender?: string;
  image: string;
}

interface CatalogItem extends Garment {
  source: "static" | "backend";
}

const VIDEO_W = 1280;
const VIDEO_H = 720;

const SHOULDER_SEAM_RATIO = 0.15;
const WIDTH_SCALE = 2.8;
const Y_OFFSET_RATIO = 0.10;

type ColabStatus = "unset" | "checking" | "connected" | "offline";
type AiState = "idle" | "loading" | "success" | "error";

async function pingColab(url: string): Promise<boolean> {
  try {
    const cleaned = url.trim().replace(/\/+$/, "");
    if (!cleaned) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    // No custom headers → simple CORS request, no OPTIONS preflight.
    // ngrok's interstitial only triggers for top-level browser navigation,
    // not for XHR/fetch, so the skip-warning header isn't needed here.
    const res = await fetch(`${cleaned}/health`, {
      signal: ctrl.signal,
      mode: "cors",
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data.status === "ok" || data.ok === true;
  } catch {
    return false;
  }
}

async function loadGarmentOnWhite(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => reject(new Error("Failed to load garment image"));
    img.src = src;
  });
}

function captureMirroredFrame(video: HTMLVideoElement): string {
  const c = document.createElement("canvas");
  c.width = video.videoWidth || VIDEO_W;
  c.height = video.videoHeight || VIDEO_H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.95);
}

export default function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const navigate = useNavigate();

  const gender =
    typeof window !== "undefined"
      ? localStorage.getItem("gender") || "men"
      : "men";

  const storedSize =
    typeof window !== "undefined"
      ? (localStorage.getItem("size") as SizeKey | null)
      : null;
  const storedGarment =
    typeof window !== "undefined"
      ? localStorage.getItem("garment")
      : null;

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const base: CatalogItem[] = catalogFor(gender).map((g) => ({
      ...g,
      source: "static",
    }));
    return base;
  });

  const [selected, setSelected] = useState<CatalogItem | null>(() => {
    const base = catalog;
    if (storedGarment) {
      return base.find((c) => c.src === storedGarment) || base[0] || null;
    }
    return base[0] || null;
  });

  const [selectedSize, setSelectedSize] = useState<SizeKey>(
    storedSize && sizes.includes(storedSize) ? storedSize : "L"
  );

  const [shoulderWidth, setShoulderWidth] = useState(0);
  const [centerX, setCenterX] = useState(VIDEO_W / 2);
  const [centerY, setCenterY] = useState(VIDEO_H / 2);
  const [angle, setAngle] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [headInFrame, setHeadInFrame] = useState(false);
  const [poseHint, setPoseHint] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [garmentMeta, setGarmentMeta] = useState<{
    aspect: number;
    shoulderFrac: number;
    bottomFrac: number;
  } | null>(null);

  const [colabUrl, setColabUrl] = useState<string>(
    () => localStorage.getItem("colabUrl") || ""
  );
  const [colabStatus, setColabStatus] = useState<ColabStatus>(
    colabUrl ? "checking" : "unset"
  );
  const [showColabModal, setShowColabModal] = useState(false);
  const [tempColabUrl, setTempColabUrl] = useState(colabUrl);
  const [colabTesting, setColabTesting] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiStatus, setAiStatus] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/garments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: BackendGarment[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        const extra = data
          .filter(
            (g) => !g.gender || g.gender === gender || g.gender === "unisex"
          )
          .map<CatalogItem>((g) => ({
            id: g._id,
            name: g.name,
            src: `${BACKEND}/uploads/${g.image}`,
            category: "top",
            source: "backend",
          }));

        setCatalog((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...extra.filter((e) => !ids.has(e.id))];
        });
      } catch (err: any) {
        setBackendError(err.message || "backend offline");
      }
    };
    load();
  }, [gender]);

  useEffect(() => {
    if (!colabUrl) return;
    let cancelled = false;
    pingColab(colabUrl).then((ok) => {
      if (!cancelled) setColabStatus(ok ? "connected" : "offline");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setGarmentMeta(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const SAMPLE_W = 160;
        const SAMPLE_H = Math.max(
          80,
          Math.round((img.naturalHeight / img.naturalWidth) * SAMPLE_W)
        );
        const c = document.createElement("canvas");
        c.width = SAMPLE_W;
        c.height = SAMPLE_H;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
        const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;

        const widths = new Array<number>(SAMPLE_H).fill(0);
        for (let y = 0; y < SAMPLE_H; y++) {
          let count = 0;
          for (let x = 0; x < SAMPLE_W; x++) {
            const i = (y * SAMPLE_W + x) * 4;
            const a = data[i + 3];
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const isContent =
              a > 30 && !(r > 240 && g > 240 && b > 240);
            if (isContent) count++;
          }
          widths[y] = count;
        }

        const maxW = widths.reduce((m, v) => (v > m ? v : m), 0);
        if (maxW < 4) {
          setGarmentMeta(null);
          return;
        }
        const shoulderThreshold = maxW * 0.78;
        let shoulderY = 0;
        for (let y = 0; y < SAMPLE_H; y++) {
          if (widths[y] >= shoulderThreshold) {
            shoulderY = y;
            break;
          }
        }
        let bottomY = SAMPLE_H - 1;
        for (let y = SAMPLE_H - 1; y >= 0; y--) {
          if (widths[y] > maxW * 0.05) {
            bottomY = y;
            break;
          }
        }

        if (cancelled) return;
        setGarmentMeta({
          aspect: img.naturalHeight / img.naturalWidth,
          shoulderFrac: shoulderY / SAMPLE_H,
          bottomFrac: bottomY / SAMPLE_H,
        });
      } catch (err) {
        if (!cancelled) setGarmentMeta(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setGarmentMeta(null);
    };
    img.src = selected.src;
    return () => {
      cancelled = true;
    };
  }, [selected?.src]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (!window.Pose || !window.Camera) {
      console.error("MediaPipe globals missing — CDN scripts failed to load");
      return;
    }
    const pose = new window.Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: any) => {
      if (!results.poseLandmarks) {
        setTracking(false);
        setHeadInFrame(false);
        setPoseHint("Stand in frame so the camera sees you");
        return;
      }

      const nose = results.poseLandmarks[0];
      const ls = results.poseLandmarks[11];
      const rs = results.poseLandmarks[12];

      const noseVisible =
        nose &&
        (nose.visibility ?? 0) > 0.25 &&
        nose.y > 0 &&
        nose.y < 1 &&
        nose.x > 0 &&
        nose.x < 1;

      const shouldersVisible =
        (ls.visibility ?? 0) > 0.5 && (rs.visibility ?? 0) > 0.5;

      const x1 = ls.x * VIDEO_W;
      const y1 = ls.y * VIDEO_H;
      const x2 = rs.x * VIDEO_W;
      const y2 = rs.y * VIDEO_H;

      const shoulderMidY = (y1 + y2) / 2;

      setCenterX((x1 + x2) / 2);
      setCenterY(shoulderMidY);
      setShoulderWidth(Math.abs(x1 - x2));
      setAngle(Math.atan2(y2 - y1, x1 - x2) * (180 / Math.PI));
      setTracking(true);
      setHeadInFrame(!!noseVisible);

      if (!noseVisible) {
        setPoseHint("Move back — your head is out of frame");
      } else if (!shouldersVisible) {
        setPoseHint("Stand square to the camera");
      } else if (shoulderMidY < VIDEO_H * 0.10) {
        setPoseHint("Move back — too close to the camera");
      } else {
        setPoseHint(null);
      }
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: VIDEO_W,
      height: VIDEO_H,
    });

    cameraRef.current = camera;
    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  const scale = sizeScaleMap[selectedSize];
  const garmentWidth = Math.max(shoulderWidth * WIDTH_SCALE * scale, 180);

  const detectedAspect = garmentMeta?.aspect ?? 1.4;
  const naturalShoulderFrac =
    garmentMeta?.shoulderFrac ?? SHOULDER_SEAM_RATIO;
  const naturalBottomFrac = garmentMeta?.bottomFrac ?? 0.95;

  // Match box height to image's natural aspect so contain doesn't letterbox.
  // This makes the image's natural shoulder seam land exactly at the
  // configured offset within the box.
  const garmentHeight = garmentWidth * detectedAspect;

  const shoulderOffsetPct = naturalShoulderFrac * 100;
  const adjustedCenterY = centerY + garmentHeight * Y_OFFSET_RATIO;

  // Crop pants region from full-body suit images
  const isLongImage =
    detectedAspect > 1.35 && naturalBottomFrac > 0.8;
  const clipBottomPct = isLongImage
    ? Math.max(0, (1 - (naturalShoulderFrac + 0.62)) * 100)
    : 0;

  const handleSaveColab = async () => {
    const cleaned = tempColabUrl.trim().replace(/\/+$/, "");
    if (!cleaned) {
      localStorage.removeItem("colabUrl");
      setColabUrl("");
      setColabStatus("unset");
      setShowColabModal(false);
      return;
    }
    setColabTesting(true);
    const ok = await pingColab(cleaned);
    setColabTesting(false);
    localStorage.setItem("colabUrl", cleaned);
    setColabUrl(cleaned);
    setColabStatus(ok ? "connected" : "offline");
    if (ok) setShowColabModal(false);
  };

  const handleCapture = async () => {
    if (!selected || !videoRef.current || isCapturing) return;
    if (colabStatus !== "connected") {
      setShowColabModal(true);
      setTempColabUrl(colabUrl);
      return;
    }

    setIsCapturing(true);
    setAiError(null);
    setCapturedPhoto(null);
    setAiResult(null);

    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 900));
    }
    setCountdown(null);

    let personDataUrl: string;
    try {
      personDataUrl = captureMirroredFrame(videoRef.current);
    } catch (err: any) {
      setAiState("error");
      setAiError(err.message || "Capture failed");
      setIsCapturing(false);
      return;
    }

    setCapturedPhoto(personDataUrl);
    setAiState("loading");
    setAiStatus("Loading garment…");

    let garmentB64: string;
    try {
      garmentB64 = await loadGarmentOnWhite(selected.src);
    } catch (err: any) {
      setAiState("error");
      setAiError(err.message || "Garment load failed");
      setIsCapturing(false);
      return;
    }

    setAiStatus("🧠 AI generating… (20–60 sec)");

    try {
      const res = await fetch(`${colabUrl}/tryon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          person_image: personDataUrl,
          garment_image: garmentB64,
          size: selectedSize,
          garment_url: selected.src,
          garment_id: selected.id,
          garment_name: selected.name,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
      }
      const data = await res.json();
      if (!data.success || !data.image)
        throw new Error(data.error || "AI returned no image");
      setAiResult(data.image);
      setAiState("success");
    } catch (err: any) {
      setAiState("error");
      setAiError(
        err.message || "Generation failed — check the Colab server is running"
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!aiResult) return;
    const a = document.createElement("a");
    a.href = `data:image/jpeg;base64,${aiResult}`;
    a.download = "virtualfit-result.jpg";
    a.click();
  };

  const closeAiModal = () => {
    setAiState("idle");
    setCapturedPhoto(null);
    setAiResult(null);
    setAiError(null);
  };

  const aiConfigured = colabStatus === "connected";

  const captureReady =
    !!selected && tracking && !isCapturing && aiState === "idle" && aiConfigured;

  const colabDot =
    colabStatus === "connected"
      ? "bg-green-400"
      : colabStatus === "offline"
      ? "bg-red-400"
      : colabStatus === "checking"
      ? "bg-amber-400 animate-pulse"
      : "bg-gray-500";

  const colabLabel =
    colabStatus === "connected"
      ? "Colab Connected"
      : colabStatus === "offline"
      ? "Colab Offline"
      : colabStatus === "checking"
      ? "Checking…"
      : "Setup Colab";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-3 sm:p-4 md:p-6 text-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
            VirtualFit Pro
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setTempColabUrl(colabUrl);
                setShowColabModal(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs sm:text-sm flex items-center gap-1.5"
              title={colabUrl || "Not configured"}
            >
              <span className={`w-2 h-2 rounded-full ${colabDot}`} />
              <span className="hidden sm:inline">⚙️ {colabLabel}</span>
              <span className="sm:hidden">⚙️</span>
            </button>
            <button
              onClick={() => navigate("/size-analysis")}
              className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">← Change Garment</span>
              <span className="sm:hidden">← Change</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs sm:text-sm"
            >
              Home
            </button>
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 lg:gap-6 flex-col lg:flex-row">
          <div className="flex flex-col items-center gap-3 mx-auto w-full lg:flex-1">
            <div
              className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl w-full"
              style={{
                aspectRatio: "3 / 4",
                maxHeight: "min(88vh, 920px)",
                maxWidth: "min(100%, 700px)",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: "scaleX(-1)",
                  objectFit: "cover",
                }}
              />

              {selected && shoulderWidth > 0 && (
                <img
                  src={selected.src}
                  alt={selected.name}
                  style={{
                    position: "absolute",
                    left: `${(1 - centerX / VIDEO_W) * 100}%`,
                    top: `${(adjustedCenterY / VIDEO_H) * 100}%`,
                    width: `${(garmentWidth / VIDEO_W) * 100}%`,
                    height: `${(garmentHeight / VIDEO_H) * 100}%`,
                    transform: `translate(-50%, -${shoulderOffsetPct}%) rotate(${angle}deg)`,
                    transformOrigin: `50% ${shoulderOffsetPct}%`,
                    objectFit: "contain",
                    objectPosition: "center top",
                    clipPath:
                      clipBottomPct > 0
                        ? `inset(0 0 ${clipBottomPct}% 0)`
                        : undefined,
                    pointerEvents: "none",
                    opacity: 1,
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
                  }}
                />
              )}

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs">
                <div>
                  {tracking && headInFrame ? (
                    <span className="text-green-400">● Tracking</span>
                  ) : tracking ? (
                    <span className="text-amber-400">● Reposition</span>
                  ) : (
                    <span className="text-amber-400">● Stand in frame</span>
                  )}
                </div>
                <div className="text-white/70 mt-1">
                  Size: <span className="font-bold">{selectedSize}</span>
                </div>
                {backendError && (
                  <div className="text-amber-300 mt-1">
                    Offline mode (local garments)
                  </div>
                )}
              </div>

              {poseHint && tracking && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black font-semibold rounded-lg px-3 py-1.5 text-xs sm:text-sm shadow-lg">
                  ⚠️ {poseHint}
                </div>
              )}

              {countdown !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="text-[140px] leading-none font-black text-white drop-shadow-2xl">
                    {countdown}
                  </div>
                  <div className="text-2xl font-semibold mt-4">
                    Hold Still! 🧍
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-[540px]">
              {captureReady ? (
                <button
                  onClick={handleCapture}
                  className="w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg transition active:scale-[0.99]"
                >
                  📸 Capture & Generate AI Try-On
                </button>
              ) : !selected ? (
                <div className="w-full py-3 text-center text-white/50 text-sm">
                  ← Select a garment to start
                </div>
              ) : !tracking ? (
                <div className="w-full py-3 text-center text-amber-300/80 text-sm">
                  Stand in frame to enable capture
                </div>
              ) : !aiConfigured ? (
                <button
                  onClick={() => {
                    setTempColabUrl(colabUrl);
                    setShowColabModal(true);
                  }}
                  className="w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold bg-white/10 hover:bg-white/20 border border-white/20 transition"
                >
                  ⚙️ Setup Colab to enable AI Capture
                </button>
              ) : (
                <div className="w-full py-3 text-center text-white/50 text-sm">
                  Working…
                </div>
              )}
              {!aiConfigured && selected && tracking && (
                <p className="text-center text-xs text-amber-300/80 mt-2">
                  ⚙️ Setup AI for photorealistic results
                </p>
              )}
            </div>
          </div>

          <div className="lg:w-96 space-y-3 sm:space-y-4 w-full">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm uppercase tracking-wide text-white/70">
                Size
              </h3>
              <div className="grid grid-cols-7 lg:grid-cols-4 gap-1.5 sm:gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition ${
                      selectedSize === s
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm uppercase tracking-wide text-white/70">
                Garment
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 max-h-[320px] sm:max-h-[420px] lg:max-h-[540px] overflow-y-auto pr-1">
                {catalog.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className={`rounded-lg overflow-hidden bg-white p-1 border-2 transition ${
                      selected?.id === g.id
                        ? "border-indigo-400"
                        : "border-transparent hover:border-white/30"
                    }`}
                  >
                    <img
                      src={g.src}
                      alt={g.name}
                      className="w-full h-16 sm:h-20 lg:h-24 object-contain"
                    />
                    <p className="text-[10px] sm:text-[11px] text-gray-700 mt-1 truncate">
                      {g.name}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="mt-3 w-full py-2 bg-red-500/80 hover:bg-red-500 rounded text-xs sm:text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {showColabModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !colabTesting && setShowColabModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">⚙️ Setup Colab</h2>
            <p className="text-white/60 text-sm mb-4">
              Paste the ngrok URL printed by your Colab Cell 6.
            </p>
            <input
              type="text"
              value={tempColabUrl}
              onChange={(e) => setTempColabUrl(e.target.value)}
              placeholder="https://xxxx.ngrok-free.app"
              className="w-full px-3 py-2.5 bg-black/40 border border-white/15 rounded-lg text-sm font-mono outline-none focus:border-indigo-400"
              disabled={colabTesting}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-3 text-xs">
              <span className={`w-2 h-2 rounded-full ${colabDot}`} />
              <span className="text-white/70">{colabLabel}</span>
              {colabUrl && (
                <span className="text-white/40 truncate ml-auto">
                  {colabUrl}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSaveColab}
                disabled={colabTesting}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
              >
                {colabTesting ? "Testing…" : "Save & Test"}
              </button>
              <button
                onClick={() => setShowColabModal(false)}
                disabled={colabTesting}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-white/40 mt-4 leading-relaxed">
              Run the 6 cells from <code>colab/IDM_VTON_Cells.md</code> on a
              Colab T4 GPU. Cell 6 prints a public ngrok URL — paste it above
              and click Save & Test. Health check hits{" "}
              <code>{"{url}/health"}</code>.
            </p>
          </div>
        </div>
      )}

      {aiState !== "idle" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          {aiState === "loading" && (
            <div className="relative w-full max-w-2xl">
              {capturedPhoto && (
                <img
                  src={capturedPhoto}
                  className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-20 blur-md"
                  alt=""
                />
              )}
              <div className="relative bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center">
                <div className="mx-auto w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin mb-5" />
                <h2 className="text-2xl font-bold mb-2">AI Processing…</h2>
                <p className="text-white/70 text-sm">{aiStatus}</p>
                <p className="text-white/40 text-xs mt-6">
                  Powered by IDM-VTON
                </p>
              </div>
            </div>
          )}

          {aiState === "success" && capturedPhoto && aiResult && (
            <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-4xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-green-400">
                  ✅ Try-On Complete!
                </h2>
                <button
                  onClick={closeAiModal}
                  className="text-white/50 hover:text-white text-2xl px-2"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50 mb-2">
                    📷 Your Photo
                  </p>
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-purple-300 mb-2">
                    ✨ You Wearing It
                  </p>
                  <img
                    src={`data:image/jpeg;base64,${aiResult}`}
                    alt="AI result"
                    className="w-full rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 mt-5">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm sm:text-base"
                >
                  ⬇️ Download Result
                </button>
                <button
                  onClick={closeAiModal}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm sm:text-base"
                >
                  ↩ Try Another
                </button>
              </div>
            </div>
          )}

          {aiState === "error" && (
            <div className="bg-slate-900/95 border border-red-500/30 rounded-3xl p-6 w-full max-w-md text-center shadow-2xl">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Generation Failed
              </h2>
              <p className="text-white/70 text-sm mb-6 break-words">
                {aiError || "Unknown error"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    closeAiModal();
                    setTempColabUrl(colabUrl);
                    setShowColabModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  ⚙️ Fix Colab URL
                </button>
                <button
                  onClick={closeAiModal}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  ↩ Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
