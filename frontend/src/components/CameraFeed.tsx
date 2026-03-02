import React, { useEffect } from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraFeed: React.FC<Props> = ({ videoRef }) => {
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    startCamera();
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: 640,
        height: 480,
        objectFit: "cover",
      }}
    />
  );
};

export default CameraFeed;