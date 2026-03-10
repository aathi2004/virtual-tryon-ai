import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface PoseData {
  left_shoulder: Point;
  right_shoulder: Point;
}

const smooth = (prev: number, curr: number, factor = 0.7) =>
  prev * factor + curr * (1 - factor);

export const usePose = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [pose, setPose] = useState<PoseData | null>(null);
  const lastPose = useRef<PoseData | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const interval = setInterval(() => {
      // ⚠️ Replace with real MediaPipe pose later
      const fakePose: PoseData = {
        left_shoulder: { x: 200 + Math.random() * 5, y: 200 },
        right_shoulder: { x: 440 + Math.random() * 5, y: 200 },
      };

      if (lastPose.current) {
        fakePose.left_shoulder.x = smooth(
          lastPose.current.left_shoulder.x,
          fakePose.left_shoulder.x
        );
        fakePose.right_shoulder.x = smooth(
          lastPose.current.right_shoulder.x,
          fakePose.right_shoulder.x
        );
      }

      lastPose.current = fakePose;
      setPose(fakePose);
    }, 33); // ~30 FPS

    return () => clearInterval(interval);
  }, [videoRef]);

  return pose;
};