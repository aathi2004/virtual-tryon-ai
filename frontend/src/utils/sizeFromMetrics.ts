import type { BodyMetrics } from "./bodyMetrics";

export function sizeFromMetrics(metrics: BodyMetrics) {
  const s = metrics.shoulderWidth;

  if (s < 0.25) return "S";
  if (s < 0.32) return "M";
  if (s < 0.38) return "L";
  if (s < 0.44) return "XL";
  if (s < 0.50) return "XXL";
  if (s < 0.56) return "XXXL";

  return "XXXXL";
}