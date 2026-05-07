import { useEffect } from "react";

export default function usePose(
  videoRef: any,
  onResults: (landmarks: any[]) => void
) {
  useEffect(() => {
    if (!videoRef.current) return;
    if (!(window as any).Pose || !(window as any).Camera) {
      console.error("MediaPipe globals missing — CDN scripts failed to load");
      return;
    }

    const pose = new (window as any).Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: any) => {
      if (results.poseLandmarks) {
        onResults(results.poseLandmarks);
      }
    });

    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);
}
