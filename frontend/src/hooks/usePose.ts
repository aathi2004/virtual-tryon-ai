import { useEffect, useRef, useState } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

export interface PoseData {
  left_shoulder: { x: number; y: number };
  right_shoulder: { x: number; y: number };
  left_hip: { x: number; y: number };
  right_hip: { x: number; y: number };
}

export const usePose = (
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const poseRef = useRef<Pose | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      if (!results.poseLandmarks || !videoRef.current) return;

      const lm = results.poseLandmarks;
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;

      setPoseData({
        left_shoulder: {
          x: lm[11].x * width,
          y: lm[11].y * height,
        },
        right_shoulder: {
          x: lm[12].x * width,
          y: lm[12].y * height,
        },
        left_hip: {
          x: lm[23].x * width,
          y: lm[23].y * height,
        },
        right_hip: {
          x: lm[24].x * width,
          y: lm[24].y * height,
        },
      });
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    poseRef.current = pose;
  }, [videoRef]);

  return poseData;
};