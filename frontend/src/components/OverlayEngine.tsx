import React from "react"
import {
  calculateTopPlacement,
  calculateBottomPlacement,
  calculateChainPlacement,
  calculateEarringPlacement
} from "../utils/poseMath"

interface Props {
  pose: any
  face: any
  garment: any
}

const OverlayEngine: React.FC<Props> = ({ pose, face, garment }) => {

  if (!pose?.pose_landmarks?.length) return null

  const leftShoulder = pose.pose_landmarks[11]
  const rightShoulder = pose.pose_landmarks[12]
  const leftHip = pose.pose_landmarks[23]
  const rightHip = pose.pose_landmarks[24]

  const leftEar = face?.face_landmarks?.[234]
  const rightEar = face?.face_landmarks?.[454]

  let placement: any = null

  if (garment.category === "top" || garment.category === "outerwear") {
    placement = calculateTopPlacement(leftShoulder, rightShoulder)
  }

  if (garment.category === "bottom") {
    placement = calculateBottomPlacement(leftHip, rightHip)
  }

  if (garment.category === "chain") {
    placement = calculateChainPlacement(leftShoulder, rightShoulder)
  }

  if (garment.category === "earring" && leftEar && rightEar) {
    placement = calculateEarringPlacement(leftEar, rightEar)
  }

  if (!placement) return null

  /* Earring special rendering */
  if (garment.category === "earring") {
    return (
      <>
        <img
          src={garment.imageUrl}
          style={{
            position: "absolute",
            left: `${placement.left.x * 100}%`,
            top: `${placement.left.y * 100}%`,
            width: "30px",
            transform: "translate(-50%, -50%)",
            zIndex: 5
          }}
        />
        <img
          src={garment.imageUrl}
          style={{
            position: "absolute",
            left: `${placement.right.x * 100}%`,
            top: `${placement.right.y * 100}%`,
            width: "30px",
            transform: "translate(-50%, -50%)",
            zIndex: 5
          }}
        />
      </>
    )
  }

  return (
    <img
      src={garment.imageUrl}
      style={{
        position: "absolute",
        left: `${placement.centerX * 100}%`,
        top: `${placement.centerY * 100}%`,
        width: `${placement.width * 600}px`,
        transform: "translate(-50%, -40%)",
        zIndex: garment.category === "chain" ? 4 : 2
      }}
    />
  )
}

export default OverlayEngine