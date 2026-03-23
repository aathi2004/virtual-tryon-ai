export interface BodyMetrics {
  shoulderWidth: number;
  chestWidth: number;
  hipWidth: number;
  centerX: number;
  centerY: number;
}

export function extractMetrics(landmarks: any[]): BodyMetrics {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);

  const centerX = (leftShoulder.x + rightShoulder.x) / 2;
  const centerY = (leftShoulder.y + rightShoulder.y) / 2;

  const chestWidth = shoulderWidth * 1.1;

  return {
    shoulderWidth,
    chestWidth,
    hipWidth,
    centerX,
    centerY,
  };
}