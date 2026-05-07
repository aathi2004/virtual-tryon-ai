import { useEffect } from "react";

export function useSegmentation(
  videoRef: React.RefObject<HTMLVideoElement>,
  maskCanvasRef: React.RefObject<HTMLCanvasElement>
) {
  useEffect(() => {

    if (!videoRef.current || !maskCanvasRef.current) return;
    if (!(window as any).SelfieSegmentation) {
      console.error("MediaPipe SelfieSegmentation missing — CDN script failed to load");
      return;
    }

    const segmentation = new (window as any).SelfieSegmentation({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    segmentation.setOptions({
      modelSelection: 1
    });

    segmentation.onResults((results: any) => {

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