import { useEffect, RefObject } from "react";
import {
  SelfieSegmentation,
  Results,
} from "@mediapipe/selfie_segmentation";
import { Camera } from "@mediapipe/camera_utils";

export function useSegmentation(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>
) {
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const segmentation = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    segmentation.setOptions({
      modelSelection: 1,
    });

    segmentation.onResults((results: Results) => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 🎥 Draw original frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (!results.segmentationMask) return;

      // 🔒 PRIVACY MASK LAYER
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.globalCompositeOperation = "source-over";
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await segmentation.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [videoRef, canvasRef]);
}