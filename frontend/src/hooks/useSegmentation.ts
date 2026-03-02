import { useEffect } from "react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

export const useSegmentation = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const segmentation = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    segmentation.setOptions({
      modelSelection: 1,
    });

    segmentation.onResults((results) => {
      const ctx =
        canvasRef.current!.getContext("2d")!;
      ctx.clearRect(
        0,
        0,
        canvasRef.current!.width,
        canvasRef.current!.height
      );

      ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvasRef.current!.width,
        canvasRef.current!.height
      );
    });

    const processFrame = async () => {
      await segmentation.send({
        image: videoRef.current!,
      });
      requestAnimationFrame(processFrame);
    };

    processFrame();
  }, [videoRef, canvasRef]);
};