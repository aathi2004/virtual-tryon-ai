import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function ClothPhysics({ mesh }: any) {

  const velocity = useRef(0);

  useFrame(() => {

    if (!mesh.current) return;

    velocity.current += 0.002;

    mesh.current.rotation.z =
      Math.sin(velocity.current) * 0.05;

  });

  return null;
}