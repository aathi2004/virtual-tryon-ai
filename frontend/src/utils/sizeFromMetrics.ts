import { BodyMetrics } from "./bodyMetrics";

export function sizeFromMetrics(metrics: BodyMetrics) {
  const s = metrics.shoulderWidth;

  if (s < 0.25) return "S";
  if (s < 0.30) return "M";
  if (s < 0.35) return "L";
  if (s < 0.40) return "XL";
  if (s < 0.45) return "XXL";

  return "XXXL";
}