import { Pose, Results } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

// Initialize the Pose model
export const initPoseModel = () => {
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true, // For background removal/body masking [cite: 350]
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return pose;
};

// Calculate shirt overlay coordinates based on shoulder landmarks
export const calculateGarmentTransform = (landmarks: any[], canvasWidth: number, canvasHeight: number) => {
  if (!landmarks) return null;

  // Landmarks: 11 = Left Shoulder, 12 = Right Shoulder, 23 = Left Hip, 24 = Right Hip
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  
  // Calculate width of shoulders to scale the shirt
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * canvasWidth;
  
  // Calculate center point between shoulders for placement
  const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * canvasWidth;
  const centerY = ((leftShoulder.y + rightShoulder.y) / 2) * canvasHeight;

  // Simple rotation calculation (slope between shoulders)
  const angle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );

  return {
    x: centerX,
    y: centerY,
    width: shoulderWidth * 2.5, // Multiplier for loose fit
    height: (Math.abs(leftHip.y - leftShoulder.y) * canvasHeight) * 1.5,
    rotation: angle
  };
};