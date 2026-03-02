export interface Landmark {
  x: number
  y: number
}

export const getMidpoint = (a: Landmark, b: Landmark) => {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  }
}

export const getDistance = (a: Landmark, b: Landmark) => {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  )
}

/* -------- Upper Body (Tops / Jackets) -------- */

export const calculateTopPlacement = (
  leftShoulder: Landmark,
  rightShoulder: Landmark
) => {

  const center = getMidpoint(leftShoulder, rightShoulder)
  const width = getDistance(leftShoulder, rightShoulder)

  return {
    centerX: center.x,
    centerY: center.y,
    width
  }
}

/* -------- Bottom Wear -------- */

export const calculateBottomPlacement = (
  leftHip: Landmark,
  rightHip: Landmark
) => {

  const center = getMidpoint(leftHip, rightHip)
  const width = getDistance(leftHip, rightHip)

  return {
    centerX: center.x,
    centerY: center.y,
    width
  }
}

/* -------- Chain Placement -------- */

export const calculateChainPlacement = (
  leftShoulder: Landmark,
  rightShoulder: Landmark
) => {

  const neck = getMidpoint(leftShoulder, rightShoulder)

  return {
    centerX: neck.x,
    centerY: neck.y + 0.05, // slight downward offset
    width: getDistance(leftShoulder, rightShoulder) * 0.5
  }
}

/* -------- Earrings Placement -------- */

export const calculateEarringPlacement = (
  leftEar: Landmark,
  rightEar: Landmark
) => {

  return {
    left: leftEar,
    right: rightEar
  }
}