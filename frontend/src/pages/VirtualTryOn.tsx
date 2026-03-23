import { useEffect, useRef, useState } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import ARGarments from "../components/ARGarments";

export default function VirtualTryOn() {

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [garments, setGarments] = useState<any[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<any>(null);

  const [shoulderWidth, setShoulderWidth] = useState(0);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);

  /* =========================
     LOAD GARMENTS
  ========================= */

  const loadGarments = async () => {

    const res = await fetch(
      "http://localhost:8000/api/garments"
    );

    const data = await res.json();

    setGarments(data);

  };

  useEffect(() => {
    loadGarments();
  }, []);

  /* =========================
     START POSE DETECTION
  ========================= */

  useEffect(() => {

    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    const camera = new Camera(videoRef.current, {

      onFrame: async () => {

        await pose.send({
          image: videoRef.current!
        });

      },

      width: 640,
      height: 480

    });

    camera.start();

  }, [selectedGarment]);

  /* =========================
     POSE RESULTS
  ========================= */

  const onResults = (results: any) => {

    if (!results.poseLandmarks) return;

    const leftShoulder = results.poseLandmarks[11];
    const rightShoulder = results.poseLandmarks[12];

    const width = 640;
    const height = 480;

    const x1 = leftShoulder.x * width;
    const y1 = leftShoulder.y * height;

    const x2 = rightShoulder.x * width;
    const y2 = rightShoulder.y * height;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    const shoulderWidth = Math.abs(x1 - x2);

    setCenterX(centerX);
    setCenterY(centerY);
    setShoulderWidth(shoulderWidth);

  };

  return (

    <div className="flex justify-center gap-10 p-10">

      {/* CAMERA */}

      <div className="relative">

        <video
          ref={videoRef}
          autoPlay
          className="w-[640px] h-[480px] rounded shadow"
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute top-0 left-0"
        />

        {selectedGarment && (

          <div
            style={{
              position: "absolute",
              top: centerY - shoulderWidth,
              left: centerX - shoulderWidth,
              width: shoulderWidth * 2,
              height: shoulderWidth * 2
            }}
          >

            <ARGarments
              textureUrl={`http://localhost:8000/uploads/${selectedGarment.image}`}
              shoulderWidth={shoulderWidth}
              centerX={centerX}
              centerY={centerY}
            />

          </div>

        )}

      </div>

      {/* GARMENT SELECTOR */}

      <div className="bg-gray-100 p-6 rounded w-64">

        <h2 className="font-semibold mb-4">
          Select Garment
        </h2>

        {garments.map((g) => (

          <button
            key={g._id}
            onClick={() => setSelectedGarment(g)}
            className="block w-full bg-blue-500 text-white p-2 rounded mb-2"
          >
            {g.name}
          </button>

        ))}

        <button
          onClick={() => setSelectedGarment(null)}
          className="w-full bg-red-500 text-white p-2 rounded mt-4"
        >
          Remove
        </button>

      </div>

    </div>

  );
}