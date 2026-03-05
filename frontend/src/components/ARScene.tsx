import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PosePoint {
  x: number;
  y: number;
}

interface PoseData {
  left_shoulder: PosePoint;
  right_shoulder: PosePoint;
  left_hip: PosePoint;
  right_hip: PosePoint;
}

interface SceneProps {
  pose: PoseData | null;
  textureUrl: string;
  videoWidth: number;
  videoHeight: number;
}

const SMOOTHING = 0.25;

const ShirtMesh: React.FC<SceneProps> = ({
  pose,
  textureUrl,
  videoWidth,
  videoHeight,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const prev = useRef({
    x: 0,
    y: 0,
    scale: 1,
    angle: 0,
  });

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(textureUrl);
  }, [textureUrl]);

  if (!pose) return null;

  const { left_shoulder, right_shoulder, left_hip, right_hip } = pose;

  const shoulderWidth =
    Math.abs(right_shoulder.x - left_shoulder.x);

  const hipWidth =
    Math.abs(right_hip.x - left_hip.x);

  const torsoDepth =
    shoulderWidth * 0.6 + hipWidth * 0.4;

  const shoulderCenterX =
    (left_shoulder.x + right_shoulder.x) / 2;

  const shoulderCenterY =
    (left_shoulder.y + right_shoulder.y) / 2;

  const hipCenterY =
    (left_hip.y + right_hip.y) / 2;

  const torsoHeight =
    Math.abs(hipCenterY - shoulderCenterY);

  const centerX = shoulderCenterX;
  const centerY = shoulderCenterY + torsoHeight * 0.35;

  const angleRad = Math.atan2(
    right_shoulder.y - left_shoulder.y,
    right_shoulder.x - left_shoulder.x
  );

  const normalizedX =
    (centerX / videoWidth - 0.5) * 6;

  const normalizedY =
    -(centerY / videoHeight - 0.5) * 4;

  const depthScale =
    (torsoDepth / videoWidth) * 5;

  const zOffset =
    -torsoDepth / videoWidth;

  const smooth = (prevVal: number, curVal: number) =>
    prevVal * (1 - SMOOTHING) + curVal * SMOOTHING;

  const smoothed = {
    x: smooth(prev.current.x, normalizedX),
    y: smooth(prev.current.y, normalizedY),
    scale: smooth(prev.current.scale, depthScale),
    angle: smooth(prev.current.angle, angleRad),
  };

  prev.current = smoothed;

  useFrame(() => {
    if (!meshRef.current) return;

    const geometry =
      meshRef.current.geometry as THREE.PlaneGeometry;

    const pos =
      geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const z =
        Math.sin(i * 0.3) * 0.02;
      pos.setZ(i, z);
    }

    pos.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      position={[
        smoothed.x,
        smoothed.y,
        zOffset,
      ]}
      rotation={[0, 0, -smoothed.angle]}
      scale={[
        smoothed.scale,
        smoothed.scale * (torsoHeight / shoulderWidth),
        1,
      ]}
    >
      <planeGeometry args={[1, 1.6, 25, 25]} />

      <meshPhongMaterial
        map={texture}
        transparent
        shininess={30}
        side={THREE.DoubleSide}
      />
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
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[0, 0, 5]}
        intensity={1}
      />

      <ShirtMesh
        pose={pose}
        textureUrl={textureUrl}
        videoWidth={videoWidth}
        videoHeight={videoHeight}
      />
    </Canvas>
  );
};

export default ARScene;