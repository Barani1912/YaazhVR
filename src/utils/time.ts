/**
 * Format seconds into MM:SS.ms display string.
 * @param seconds - Time in seconds
 * @returns Formatted string like "01:23.4"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

/**
 * Format seconds into a short duration string.
 * @param seconds - Duration in seconds
 * @returns e.g., "10s", "1m 30s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Convert pixel position on timeline to time in seconds.
 * @param px - Pixel position
 * @param zoom - Zoom level (pixels per second)
 * @param scrollOffset - Current scroll offset in pixels
 * @returns Time in seconds
 */
export function pixelsToTime(px: number, zoom: number, scrollOffset: number = 0): number {
  return (px + scrollOffset) / zoom;
}

/**
 * Convert time in seconds to pixel position on timeline.
 * @param time - Time in seconds
 * @param zoom - Zoom level (pixels per second)
 * @param scrollOffset - Current scroll offset in pixels
 * @returns Pixel position
 */
export function timeToPixels(time: number, zoom: number, scrollOffset: number = 0): number {
  return time * zoom - scrollOffset;
}

/**
 * Snap a time value to the nearest grid division.
 * @param time - Time in seconds
 * @param gridSize - Grid size in seconds (e.g., 0.1 for 100ms)
 * @returns Snapped time
 */
export function snapToGrid(time: number, gridSize: number): number {
  return Math.round(time / gridSize) * gridSize;
}
