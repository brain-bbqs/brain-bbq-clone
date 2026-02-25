// Brain silhouette path and utilities for constraining graph nodes

// Brain outline as a polygon (normalized 0-1 coordinates, will be scaled to canvas)
// This is a simplified brain silhouette viewed from the side
const BRAIN_POLYGON: [number, number][] = [
  // Frontal lobe (left)
  [0.15, 0.52], [0.12, 0.45], [0.11, 0.38], [0.13, 0.30],
  [0.17, 0.24], [0.22, 0.19], [0.28, 0.15], [0.35, 0.13],
  // Top of brain
  [0.42, 0.12], [0.50, 0.11], [0.58, 0.12], [0.65, 0.13],
  // Parietal lobe
  [0.72, 0.15], [0.78, 0.19], [0.83, 0.24], [0.87, 0.30],
  // Occipital lobe (right)
  [0.89, 0.37], [0.90, 0.44], [0.89, 0.52], [0.87, 0.58],
  // Temporal lobe (bottom right)
  [0.83, 0.64], [0.78, 0.69], [0.72, 0.72], [0.65, 0.74],
  // Brain stem area
  [0.58, 0.75], [0.52, 0.78], [0.48, 0.80], [0.45, 0.78],
  // Cerebellum bump
  [0.42, 0.75], [0.38, 0.74], [0.35, 0.72],
  // Temporal lobe (bottom left)
  [0.28, 0.69], [0.22, 0.64], [0.18, 0.58],
];

// Region assignments for node types (normalized center coordinates within brain)
export const TYPE_REGIONS: Record<string, { cx: number; cy: number; spread: number }> = {
  project:      { cx: 0.50, cy: 0.35, spread: 0.15 }, // Central cortex
  species:      { cx: 0.30, cy: 0.30, spread: 0.10 }, // Frontal lobe
  investigator: { cx: 0.70, cy: 0.30, spread: 0.10 }, // Parietal lobe
  meta_tag:     { cx: 0.50, cy: 0.55, spread: 0.12 }, // Deep structures
  publication:  { cx: 0.80, cy: 0.50, spread: 0.08 }, // Occipital
  resource:     { cx: 0.25, cy: 0.55, spread: 0.08 }, // Temporal
};

// Check if a point is inside the brain polygon using ray casting
function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Find nearest point inside the polygon
function projectIntoPolygon(x: number, y: number, polygon: [number, number][]): [number, number] {
  if (pointInPolygon(x, y, polygon)) return [x, y];

  // Find closest edge point
  let bestDist = Infinity;
  let bestX = x, bestY = y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[j];
    const [bx, by] = polygon[i];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const px = ax + t * dx, py = ay + t * dy;
    const dist = (x - px) ** 2 + (y - py) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestX = px;
      bestY = py;
    }
  }

  // Push slightly inside
  const cx = 0.5, cy = 0.45;
  const pushX = (cx - bestX) * 0.05;
  const pushY = (cy - bestY) * 0.05;
  return [bestX + pushX, bestY + pushY];
}

// Generate home position for a node based on its type
export function getHomePosition(
  nodeType: string,
  index: number,
  total: number,
  width: number,
  height: number
): { x: number; y: number } {
  const region = TYPE_REGIONS[nodeType] || TYPE_REGIONS.meta_tag;

  // Spiral placement within region
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 * 3; // 3 revolutions
  const dist = (index / Math.max(total, 1)) * region.spread;

  let nx = region.cx + Math.cos(angle) * dist;
  let ny = region.cy + Math.sin(angle) * dist * 0.7; // Slightly compressed vertically

  // Ensure within brain
  [nx, ny] = projectIntoPolygon(nx, ny, BRAIN_POLYGON);

  return { x: nx * width, y: ny * height };
}

// Constrain a position to stay inside the brain
export function constrainToBrain(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const nx = x / width;
  const ny = y / height;
  const [cx, cy] = projectIntoPolygon(nx, ny, BRAIN_POLYGON);
  return { x: cx * width, y: cy * height };
}

// Get the brain outline as an SVG path (scaled to canvas dimensions)
export function getBrainPath(width: number, height: number): string {
  const points = BRAIN_POLYGON.map(([x, y]) => `${x * width},${y * height}`);
  return `M ${points.join(" L ")} Z`;
}
