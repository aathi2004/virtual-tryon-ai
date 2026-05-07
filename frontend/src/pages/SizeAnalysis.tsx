import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { catalogFor, type Garment } from "../data/garments";

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    SelfieSegmentation: any;
  }
}

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

const recommendSize = (shoulderNorm: number): SizeKey => {
  if (shoulderNorm < 0.25) return "S";
  if (shoulderNorm < 0.32) return "M";
  if (shoulderNorm < 0.38) return "L";
  if (shoulderNorm < 0.44) return "XL";
  if (shoulderNorm < 0.50) return "XXL";
  if (shoulderNorm < 0.56) return "XXXL";
  return "XXXXL";
};

const VIDEO_W = 1280;
const VIDEO_H = 720;

const SHOULDER_SEAM_RATIO = 0.15;
const WIDTH_SCALE = 2.8;
const Y_OFFSET_RATIO = 0.10;

const SizeAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  const gender =
    typeof window !== "undefined"
      ? localStorage.getItem("gender") || "men"
      : "men";

  const catalog = catalogFor(gender);

  const [shoulderWidth, setShoulderWidth] = useState(0);
  const [centerX, setCenterX] = useState(VIDEO_W / 2);
  const [centerY, setCenterY] = useState(VIDEO_H / 2);
  const [angle, setAngle] = useState(0);
  const [shoulderNorm, setShoulderNorm] = useState(0.25);
  const [recommendedSize, setRecommendedSize] = useState<SizeKey>("L");
  const [selectedSize, setSelectedSize] = useState<SizeKey>("L");
  const [manualSize, setManualSize] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<Garment>(catalog[0]);
  const [panelOpen, setPanelOpen] = useState(false);
  const manualRef = useRef(false);

  const [garmentMeta, setGarmentMeta] = useState<{
    aspect: number;
    shoulderFrac: number;
    bottomFrac: number;
  } | null>(null);

  useEffect(() => {
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
            if (a > 30 && !(r > 240 && g > 240 && b > 240)) count++;
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
      } catch {
        if (!cancelled) setGarmentMeta(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setGarmentMeta(null);
    };
    img.src = selectedGarment.src;
    return () => {
      cancelled = true;
    };
  }, [selectedGarment.src]);

  useEffect(() => {
    manualRef.current = manualSize;
  }, [manualSize]);

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
        setPoseReady(false);
        return;
      }

      const ls = results.poseLandmarks[11];
      const rs = results.poseLandmarks[12];

      const x1 = ls.x * VIDEO_W;
      const y1 = ls.y * VIDEO_H;
      const x2 = rs.x * VIDEO_W;
      const y2 = rs.y * VIDEO_H;
      const shoulderMidY = (y1 + y2) / 2;

      const widthNorm = Math.abs(ls.x - rs.x);
      setShoulderNorm(widthNorm);
      setShoulderWidth(Math.abs(x1 - x2));
      setCenterX((x1 + x2) / 2);
      setCenterY(shoulderMidY);
      setAngle(Math.atan2(y2 - y1, x1 - x2) * (180 / Math.PI));
      setPoseReady(true);

      const rec = recommendSize(widthNorm);
      setRecommendedSize(rec);
      if (!manualRef.current) setSelectedSize(rec);
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

  const garmentHeight = garmentWidth * detectedAspect;

  const shoulderOffsetPct = naturalShoulderFrac * 100;
  const adjustedCenterY = centerY + garmentHeight * Y_OFFSET_RATIO;

  const isLongImage =
    detectedAspect > 1.35 && naturalBottomFrac > 0.8;
  const clipBottomPct = isLongImage
    ? Math.max(0, (1 - (naturalShoulderFrac + 0.62)) * 100)
    : 0;

  const confirmAndTryOn = () => {
    localStorage.setItem("size", selectedSize);
    localStorage.setItem("recommendedSize", recommendedSize);
    localStorage.setItem("garment", selectedGarment.src);
    localStorage.setItem("garmentId", selectedGarment.id);
    navigate("/try-on");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="flex-1 relative flex justify-center items-center p-2 sm:p-3 min-h-0">
        <div
          className="relative rounded-xl sm:rounded-[22px] overflow-hidden shadow-2xl bg-black w-full mx-auto"
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

          {shoulderWidth > 0 && (
            <img
              src={selectedGarment.src}
              alt={selectedGarment.name}
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
                opacity: 1,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
                pointerEvents: "none",
              }}
            />
          )}

          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/95 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-xl backdrop-blur">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-gray-500">
              Shoulder
            </p>
            <p className="font-mono text-[11px] sm:text-sm">
              {shoulderNorm.toFixed(3)}{" "}
              {poseReady ? (
                <span className="text-green-600">● tracking</span>
              ) : (
                <span className="text-amber-600">● stand in frame</span>
              )}
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-gray-500 mt-1 sm:mt-2">
              AI Recommended
            </p>
            <p className="font-bold text-indigo-600 text-base sm:text-lg leading-tight">
              {recommendedSize}
            </p>
          </div>

          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2">
            <button
              onClick={() => setPanelOpen(true)}
              className="md:hidden px-2.5 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs backdrop-blur"
            >
              Garments
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-2.5 sm:px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm backdrop-blur"
            >
              ← Home
            </button>
          </div>

          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-xl sm:rounded-2xl shadow-xl px-2 sm:px-3 py-1.5 sm:py-2 flex flex-wrap gap-1.5 sm:gap-2 max-w-[95%] items-center justify-center">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedSize(s);
                  setManualSize(true);
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-sm font-semibold transition ${
                  selectedSize === s
                    ? "bg-indigo-600 text-white"
                    : s === recommendedSize
                    ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {s}
                {s === recommendedSize && " ★"}
              </button>
            ))}
            <button
              onClick={confirmAndTryOn}
              className="ml-1 sm:ml-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-[11px] sm:text-sm font-semibold"
            >
              Try On →
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden md:block w-[280px] lg:w-[300px] h-screen overflow-y-auto p-3 bg-white border-l border-gray-200">
        <h3 className="font-semibold mb-3 text-gray-800">
          Garments · {gender === "women" ? "Women" : "Men"}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {catalog.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGarment(g)}
              className={`rounded-lg overflow-hidden border-2 bg-gray-50 p-1 transition ${
                selectedGarment.id === g.id
                  ? "border-indigo-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img src={g.src} alt={g.name} className="w-full h-24 object-contain" />
              <p className="text-[11px] text-gray-700 mt-1 truncate">{g.name}</p>
            </button>
          ))}
        </div>
      </aside>

      {panelOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setPanelOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white p-3 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                Garments · {gender === "women" ? "Women" : "Men"}
              </h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-500 text-xl px-2"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {catalog.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGarment(g);
                    setPanelOpen(false);
                  }}
                  className={`rounded-lg overflow-hidden border-2 bg-gray-50 p-1 transition ${
                    selectedGarment.id === g.id
                      ? "border-indigo-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={g.src}
                    alt={g.name}
                    className="w-full h-24 object-contain"
                  />
                  <p className="text-[11px] text-gray-700 mt-1 truncate">
                    {g.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeAnalysis;
