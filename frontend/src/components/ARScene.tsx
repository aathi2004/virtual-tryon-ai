import React, { useMemo } from "react";
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

interface SceneProps {
  pose: PoseData | null;
  textureUrl: string;
  videoWidth: number;
  videoHeight: number;
}

const ShirtMesh: React.FC<SceneProps> = ({
  pose,
  textureUrl,
  videoWidth,
  videoHeight,
}) => {
  if (!pose) return null;

  const texture = useMemo(() => {
    return new THREE.TextureLoader().load(textureUrl);
  }, [textureUrl]);

  const { left_shoulder, right_shoulder } = pose;

  const shoulderWidth =
    Math.abs(right_shoulder.x - left_shoulder.x);

  const centerX =
    (left_shoulder.x + right_shoulder.x) / 2;

  const centerY =
    (left_shoulder.y + right_shoulder.y) / 2;

  const width = shoulderWidth * 1.2;
  const height = shoulderWidth * 1.5;

  const angleRad = Math.atan2(
    right_shoulder.y - left_shoulder.y,
    right_shoulder.x - left_shoulder.x
  );

  return (
    <mesh
      position={[
        (centerX - videoWidth / 2) / 100,
        -(centerY - videoHeight / 2) / 100,
        0,
      ]}
      rotation={[0, 0, -angleRad]}
      scale={[width / 200, height / 200, 1]}
    >
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

const ARScene: React.FC<SceneProps> = ({
  pose,
  textureUrl,
  videoWidth,
  videoHeight,
}) => {
  return (
   <Canvas
  style={{
    position: "absolute",
    width: videoWidth,
    height: videoHeight,
    top: 0,
    left: 0,
    pointerEvents: "none",
  }}
>
      <ambientLight intensity={1} />

      {pose && (
        <ShirtMesh
          pose={pose}
          textureUrl={textureUrl}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
        />
      )}
    </Canvas>
  );
};

export default ARScene;