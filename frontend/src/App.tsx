import React, { useRef } from "react";
import CameraFeed from "./components/CameraFeed";
import ARScene from "./components/ARScene";
import { usePose } from "./hooks/usePose";
import { useSegmentation } from "./hooks/useSegmentation";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const poseData = usePose(videoRef);
  useSegmentation(videoRef, maskCanvasRef);

  return (
    <div style={{ position: "relative" }}>
      <CameraFeed videoRef={videoRef} />

      <canvas
        ref={maskCanvasRef}
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0.3,
        }}
      />

      {poseData && (
        <ARScene
          pose={poseData}
          textureUrl="/assets/red-shirt.png"
          videoWidth={640}
          videoHeight={480}
        />
      )}
    </div>
  );
};

export default App;