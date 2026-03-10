export function detectBodySize(
  shoulderWidth:number,
  torsoHeight:number
){

  const ratio = shoulderWidth / torsoHeight;

  if(ratio < 0.45) return "S";
  if(ratio < 0.55) return "M";
  return "L";
}