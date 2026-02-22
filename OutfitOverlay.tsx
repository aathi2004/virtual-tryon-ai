import React from "react";

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

const OutfitOverlay: React.FC<Props> = ({ garment, pose }) => {
  if (!pose) return null;

  const { left_shoulder, right_shoulder } = pose;

  // Shoulder width
  const shoulderWidth =
    Math.abs(right_shoulder.x - left_shoulder.x);

  // Center X
  const centerX =
    (left_shoulder.x + right_shoulder.x) / 2;

  // 👇 KEY CHANGE: height based on width ratio
  const width = shoulderWidth * 1.15;
  const height = shoulderWidth * 1.45;

  const x = centerX - width / 2;

  // Align just slightly below shoulder line
  const y = left_shoulder.y - height * 0.15;

  return (
    <img
      src={garment.imageUrl}
      alt="overlay"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: width,
        height: height,
        pointerEvents: "none",
      }}
    />
  );
};

export default OutfitOverlay;