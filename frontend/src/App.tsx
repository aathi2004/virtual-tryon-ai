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
  <div style={{ display: "flex" }}>
    
    {/* LEFT SIDE CAMERA */}
    <div
      style={{
        position: "relative",
        width: 640,
        height: 480,
      }}
    >
      <CameraFeed videoRef={videoRef} />

      <ARScene
        pose={poseData}
        textureUrl="/assets/blue-shirt.png"
        videoWidth={640}
        videoHeight={480}
      />
    </div>

    {/* RIGHT SIDE GARMENTS */}
    <div style={{ marginLeft: 40 }}>
      <GarmentsList />
    </div>

  </div>
);

export default App;