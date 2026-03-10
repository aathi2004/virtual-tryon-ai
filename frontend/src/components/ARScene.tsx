import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

interface PosePoint {
  x: number;
  y: number;
}

interface PoseData {
  left_shoulder: PosePoint;
  right_shoulder: PosePoint;
}

interface Props {
  pose: PoseData | null;
  videoWidth: number;
  videoHeight: number;
}

function GarmentMesh({ pose }: { pose: PoseData }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    if (!pose || !meshRef.current) return;

    const { left_shoulder, right_shoulder } = pose;

    // 🧠 User shoulder width (pixels)
    const userShoulderWidth = Math.abs(
      right_shoulder.x - left_shoulder.x
    );

    // 👕 Shoulder width of 3D model (tweak once)
    const modelShoulderWidth = 180;

    // 📏 Auto scale
    const scaleFactor = userShoulderWidth / modelShoulderWidth;

    meshRef.current.scale.set(
      scaleFactor,
      scaleFactor,
      scaleFactor
    );

    // 🎯 Position center on shoulders
    const centerX =
      (left_shoulder.x + right_shoulder.x) / 2;
    const centerY =
      (left_shoulder.y + right_shoulder.y) / 2;

    meshRef.current.position.set(
      (centerX - 320) / 100,
      -(centerY - 240) / 100,
      0
    );

    // 🔄 Rotation by shoulder slope
    const angleRad = Math.atan2(
      right_shoulder.y - left_shoulder.y,
      right_shoulder.x - left_shoulder.x
    );

    meshRef.current.rotation.z = -angleRad;

  }, [pose]);

  return (
    <mesh ref={meshRef}>
      {/* 👕 Shirt Shape */}
      <boxGeometry args={[2, 2.5, 0.4]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  );
}

const ARScene: React.FC<Props> = ({
  pose,
  videoWidth,
  videoHeight,
}) => {
  if (!pose) return null;

  return (
    <Canvas
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[0, 0, 5]} />

      <GarmentMesh pose={pose} />
    </Canvas>
  );
};

export default ARScene;