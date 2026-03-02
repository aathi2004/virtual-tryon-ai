import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
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
  textureUrl: string;
  videoWidth: number;
  videoHeight: number;
}

const ShirtMesh: React.FC<Props> = ({
  pose,
  textureUrl,
  videoWidth,
  videoHeight,
}) => {
  const texture = useTexture(textureUrl);

  if (!pose