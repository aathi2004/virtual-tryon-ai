import React, { useRef, useState } from "react";
import CameraFeed from "./components/CameraFeed";
import ARScene from "./components/ARScene";
import GarmentsList from "./components/GarmentsList";
import { usePose } from "./hooks/usePose";
import { useSegmentation } from "./hooks/useSegmentation";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const poseData = usePose(videoRef);
  useSegmentation(videoRef, maskCanvasRef);

  const [selectedTexture, setSelectedTexture] = useState(
    "/assets/blue-shirt.png"
  );

  return (
    <div
      style={{
        display: "flex",
        padding: 20,
        gap: 40,
      }}
    >
      {/* LEFT SIDE CAMERA + AR */}
      <div
        style={{
          position: "relative",
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        }}
      >
        {/* Camera */}
        <CameraFeed videoRef={videoRef} />

        {/* Segmentation Mask Canvas (optional visual layer) */}
        <canvas
          ref={maskCanvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />

        {/* AR Shirt Mesh */}
        <ARScene
          pose={poseData}
          textureUrl={selectedTexture}
          videoWidth={VIDEO_WIDTH}
          videoHeight={VIDEO_HEIGHT}
        />
      </div>

      {/* RIGHT SIDE GARMENTS */}
      <div style={{ minWidth: 250 }}>
        <GarmentsList onSelect={setSelectedTexture} />
      </div>
    </div>
  );
};

export default App;