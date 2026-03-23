import { useEffect } from "react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

export function useSegmentation(
  videoRef: React.RefObject<HTMLVideoElement>,
  maskCanvasRef: React.RefObject<HTMLCanvasElement>
) {
  useEffect(() => {

    if (!videoRef.current || !maskCanvasRef.current) return;

    const segmentation = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    segmentation.setOptions({
      modelSelection: 1
    });

    segmentation.onResults((results) => {

      const canvas = maskCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = videoRef.current!.videoWidth;
      canvas.height = videoRef.current!.videoHeight;

      ctx.clearRect(0,0,canvas.width,canvas.height);

      ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvas.width,
        canvas.height
      );

    });

    const process = async () => {

      await segmentation.send({
        image: videoRef.current!
      });

      requestAnimationFrame(process);

    };

    process();

  }, []);
}