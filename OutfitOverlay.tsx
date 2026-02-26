import React, { useRef } from "react";

interface PosePoint {
  x: number;
  y: number;
}

interface PoseData {
  left_shoulder: PosePoint;
  right_shoulder: PosePoint;
  left_hip: PosePoint;
  right_hip: PosePoint;
}

interface Props {
  garment: {
    imageUrl: string;
  };
  pose: PoseData;
}

const SMOOTHING = 0.25;

const OutfitOverlay: React.FC<Props> = ({ garment, pose }) => {
  if (!pose) return null;

  const prev = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    angle: 0,
    skew: 0,
  });

  const {
    left_shoulder,
    right_shoulder,
    left_hip,
    right_hip,
  } = pose;

  // ===============================
  // 1️⃣ BASE BODY METRICS
  // ===============================

  const shoulderWidth =
    Math.abs(right_shoulder.x - left_shoulder.x);

  const hipWidth =
    Math.abs(right_hip.x - left_hip.x);

  const torsoHeight =
    Math.abs(
      (left_hip.y + right_hip.y) / 2 -
        left_shoulder.y
    );

  // ===============================
  // 2️⃣ DEPTH ESTIMATION
  // ===============================

  const depth =
    shoulderWidth * 0.6 +
    hipWidth * 0.2 +
    torsoHeight * 0.2;

  const scaleFactor = depth / 300; // tune baseline

  const width = scaleFactor * 250;
  const height = scaleFactor * 320;

  // ===============================
  // 3️⃣ POSITIONING
  // ===============================

  const centerX =
    (left_shoulder.x + right_shoulder.x) / 2;

  const x = centerX - width / 2;
  const y =
    left_shoulder.y - height * 0.2;

  // ===============================
  // 4️⃣ ROTATION (SHOULDER ROLL)
  // ===============================

  const angleRad = Math.atan2(
    right_shoulder.y - left_shoulder.y,
    right_shoulder.x - left_shoulder.x
  );

  const angleDeg =
    angleRad * (180 / Math.PI);

  // ===============================
  // 5️⃣ BODY TURN (YAW SKEW)
  // ===============================

  const yawFactor =
    (right_shoulder.x - left_shoulder.x) /
    shoulderWidth;

  const skewDeg = yawFactor * 8;

  // ===============================
  // 6️⃣ SMOOTHING
  // ===============================

  const smooth = (
    prevVal: number,
    currentVal: number
  ) =>
    prevVal * (1 - SMOOTHING) +
    currentVal * SMOOTHING;

  const smoothed = {
    x: smooth(prev.current.x, x),
    y: smooth(prev.current.y, y),
    width: smooth(prev.current.width, width),
    height: smooth(prev.current.height, height),
    angle: smooth(prev.current.angle, angleDeg),
    skew: smooth(prev.current.skew, skewDeg),
  };

  prev.current = smoothed;

  // ===============================
  // 7️⃣ RENDER
  // ===============================

  return (
    <img
      src={garment.imageUrl}
      alt="overlay"
      style={{
        position: "absolute",
        left: smoothed.x,
        top: smoothed.y,
        width: smoothed.width,
        height: smoothed.height,
        transform: `
          rotate(${smoothed.angle}deg)
          skewX(${smoothed.skew}deg)
        `,
        transformOrigin: "top center",
        pointerEvents: "none",
      }}
    />
  );
};

export default OutfitOverlay;