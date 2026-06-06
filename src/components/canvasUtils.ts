/**
 * Canvas utilities for coordinate transformation and viewport management
 */

/**
 * Transform state for the canvas
 */
export interface CanvasTransform {
  translateX: number;
  translateY: number;
  scale: number;
}

/**
 * Transform a point from screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: CanvasTransform
): { x: number; y: number } {
  // Inverse transform: (point - translation) / scale
  return {
    x: (screenX - transform.translateX) / transform.scale,
    y: (screenY - transform.translateY) / transform.scale,
  };
}

/**
 * Transform a point from canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  transform: CanvasTransform
): { x: number; y: number } {
  // Forward transform: point * scale + translation
  return {
    x: canvasX * transform.scale + transform.translateX,
    y: canvasY * transform.scale + transform.translateY,
  };
}

/**
 * Get the visible bounds of the canvas in world coordinates
 */
export function getViewportBounds(
  screenWidth: number,
  screenHeight: number,
  transform: CanvasTransform
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const topLeft = screenToCanvas(0, 0, transform);
  const bottomRight = screenToCanvas(screenWidth, screenHeight, transform);

  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/**
 * Check if a point is visible on screen
 */
export function isPointVisible(
  point: { x: number; y: number },
  screenWidth: number,
  screenHeight: number,
  transform: CanvasTransform
): boolean {
  const bounds = getViewportBounds(screenWidth, screenHeight, transform);
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

/**
 * Check if a rectangle intersects with viewport
 */
export function isRectVisible(
  rect: { x: number; y: number; width: number; height: number },
  screenWidth: number,
  screenHeight: number,
  transform: CanvasTransform
): boolean {
  const bounds = getViewportBounds(screenWidth, screenHeight, transform);
  return !(
    rect.x + rect.width < bounds.minX ||
    rect.x > bounds.maxX ||
    rect.y + rect.height < bounds.minY ||
    rect.y > bounds.maxY
  );
}

/**
 * Calculate distance between two points
 */
export function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in radians
 */
export function angle(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smoothly interpolate between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get the center point of a rectangle
 */
export function getRectCenter(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Scale a rectangle while keeping center fixed
 */
export function scaleRectFromCenter(
  rect: { x: number; y: number; width: number; height: number },
  scale: number
): { x: number; y: number; width: number; height: number } {
  const center = getRectCenter(rect);
  const newWidth = rect.width * scale;
  const newHeight = rect.height * scale;

  return {
    x: center.x - newWidth / 2,
    y: center.y - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Fit a rectangle within another rectangle maintaining aspect ratio
 */
export function fitRectInRect(
  innerRect: { width: number; height: number },
  outerRect: { width: number; height: number }
): number {
  const scaleX = outerRect.width / innerRect.width;
  const scaleY = outerRect.height / innerRect.height;
  return Math.min(scaleX, scaleY);
}

/**
 * Get transform to center and fit content
 */
export function getFitTransform(
  contentBounds: { x: number; y: number; width: number; height: number },
  viewportSize: { width: number; height: number }
): CanvasTransform {
  // Calculate scale to fit
  const scale = fitRectInRect(
    { width: contentBounds.width, height: contentBounds.height },
    viewportSize
  );

  // Calculate center position
  const contentCenter = getRectCenter(contentBounds);
  const viewportCenter = {
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  };

  return {
    scale,
    translateX: viewportCenter.x - contentCenter.x * scale,
    translateY: viewportCenter.y - contentCenter.y * scale,
  };
}

/**
 * Get grid cell at a given canvas coordinate
 */
export function getGridCell(
  canvasX: number,
  canvasY: number,
  gridSize: number
): { row: number; col: number } {
  return {
    row: Math.floor(canvasY / gridSize),
    col: Math.floor(canvasX / gridSize),
  };
}

/**
 * Get canvas coordinate for a grid cell
 */
export function getGridCellPosition(
  row: number,
  col: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: col * gridSize,
    y: row * gridSize,
  };
}

/**
 * Check if point is close to another point (within threshold)
 */
export function isPointNear(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  threshold: number
): boolean {
  return distance(point1, point2) <= threshold;
}

/**
 * Get closest point on line segment to a point
 */
export function getClosestPointOnLine(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): { x: number; y: number } {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return lineStart;
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Normalize angle to 0-2π range
 */
export function normalizeAngle(radians: number): number {
  return ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Get the bounding box of multiple points
 */
export function getBoundingBox(
  points: Array<{ x: number; y: number }>
): { x: number; y: number; width: number; height: number } | null {
  if (points.length === 0) return null;

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
