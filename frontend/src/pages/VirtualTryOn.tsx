import Webcam from "react-webcam";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";

export default function VirtualTryOn() {
  const webcamRef = useRef<Webcam>(null);

  return (
    <div className="h-screen w-full bg-black flex">
      
      {/* 🎥 Live Camera */}
      <div className="flex-1 relative">
        <Webcam
          ref={webcamRef}
          mirrored
          className="absolute w-full h-full object-cover"
        />

        {/* 👕 3D Garment Overlay */}
        <Canvas className="absolute w-full h-full">
          <ambientLight intensity={1} />
          <directionalLight position={[0, 0, 5]} />
          
          {/* Example Shirt Model */}
          <mesh position={[0, -1, 0]}>
            <boxGeometry args={[2, 2.5, 0.5]} />
            <meshStandardMaterial color="blue" />
          </mesh>

          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* 🧥 Garments Panel */}
      <div className="w-80 bg-white p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Garments</h2>
        <button className="block w-full mb-2 p-2 bg-gray-200 rounded">Shirt</button>
        <button className="block w-full mb-2 p-2 bg-gray-200 rounded">Jacket</button>
        <button className="block w-full mb-2 p-2 bg-gray-200 rounded">Pants</button>
      </div>

    </div>
  );
}