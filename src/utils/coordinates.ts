// ─── Image coords → Spatial coords ────────────────────────────────
// Maps pixel position on image to spatial audio coordinates
// BRD spec: Left x=-5, Right x=5, Top y=3, Bottom y=-3, Center x=0 y=0

/**
 * Convert canvas pixel coordinates to spatial audio coordinates.
 * @param px - X pixel position on image
 * @param py - Y pixel position on image
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @returns Spatial coordinates { x: -5..5, y: -3..3 }
 */
export function imageToSpatial(
  px: number,
  py: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  // Normalize to 0..1
  const nx = imageWidth > 0 ? px / imageWidth : 0.5;
  const ny = imageHeight > 0 ? py / imageHeight : 0.5;

  // Map to spatial range
  // x: 0..1 → -5..5
  // y: 0..1 → 3..-3 (inverted because canvas Y is top-down)
  return {
    x: (nx - 0.5) * 10, // -5 to 5
    y: (0.5 - ny) * 6,  // 3 to -3
  };
}

/**
 * Convert spatial audio coordinates back to canvas pixel coordinates.
 * @param sx - Spatial X (-5 to 5)
 * @param sy - Spatial Y (-3 to 3)
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @returns Pixel coordinates { x, y }
 */
export function spatialToImage(
  sx: number,
  sy: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  // Reverse the mapping
  const nx = sx / 10 + 0.5;
  const ny = 0.5 - sy / 6;

  return {
    x: nx * imageWidth,
    y: ny * imageHeight,
  };
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp spatial coordinates to valid ranges.
 */
export function clampSpatial(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(x, -5, 5),
    y: clamp(y, -3, 3),
  };
}
