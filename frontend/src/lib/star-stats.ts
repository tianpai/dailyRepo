// A point on the time series where x is the day index (integer) and
// y is the cumulative star count for that day.
export type Point = { x: number; y: number };

/**
 * Compute coefficient of determination (R²) for a simple linear regression
 * on the provided (x, y) points. Values close to 1 indicate a strong
 * linear relationship.
 */
export function computeR2(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 1;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0,
    sxy = 0,
    sst = 0,
    ssr = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    sst += dy * dy;
  }
  const b = sxx !== 0 ? sxy / sxx : 0;
  const a = meanY - b * meanX;
  for (const p of points) {
    const yhat = a + b * p.x;
    const resid = p.y - yhat;
    ssr += resid * resid;
  }
  return sst !== 0 ? 1 - ssr / sst : 1;
}

// --- Segmented (piecewise) linear helpers ---
type FitResult = { a: number; b: number; sse: number };

function fitLine(points: Point[]): FitResult {
  const n = points.length;
  if (n === 0) return { a: 0, b: 0, sse: 0 };
  let sumX = 0,
    sumY = 0,
    sumXX = 0,
    sumXY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXX += p.x * p.x;
    sumXY += p.x * p.y;
  }
  const denom = n * sumXX - sumX * sumX;
  const b = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const a = n !== 0 ? sumY / n - b * (sumX / n) : 0;
  let sse = 0;
  for (const p of points) {
    const yhat = a + b * p.x;
    const r = p.y - yhat;
    sse += r * r;
  }
  return { a, b, sse };
}

export function detectTurningPointsSegmented(
  points: Point[],
  options?: {
    maxPoints?: number;
    minGapDays?: number;
    minRelImprovement?: number;
    minSegmentPoints?: number;
  },
): Array<{ day: number; value: number }> {
  const n = points.length;
  if (n < 7) return [];
  const maxPoints = options?.maxPoints ?? 3;
  const minGapDays = options?.minGapDays ?? Math.max(7, Math.floor(n / 10));
  const minRelImprovement = options?.minRelImprovement ?? 0.15; // 15% better than single-line fit
  const minSegPts = options?.minSegmentPoints ?? 5;

  const global = fitLine(points);
  const baseSSE = global.sse || 1; // avoid division by zero

  type SegCand = {
    idx: number;
    day: number;
    value: number;
    relImprovement: number;
  };
  const candidates: SegCand[] = [];

  for (let k = minSegPts - 1; k <= n - minSegPts - 1; k++) {
    const left = points.slice(0, k + 1);
    const right = points.slice(k + 1);
    const sse = fitLine(left).sse + fitLine(right).sse;
    const relImprovement = (baseSSE - sse) / baseSSE;
    const nextIdx = Math.min(k + 1, n - 1);
    candidates.push({
      idx: nextIdx,
      day: points[nextIdx].x,
      value: points[nextIdx].y,
      relImprovement,
    });
  }

  const filtered = candidates.filter(
    (c) => c.relImprovement >= minRelImprovement,
  );
  filtered.sort((a, b) => b.relImprovement - a.relImprovement);

  const selected: Array<{ day: number; value: number }> = [];
  for (const c of filtered) {
    if (selected.length >= maxPoints) break;
    if (selected.some((s) => Math.abs(s.day - c.day) < minGapDays)) continue;
    if (selected.some((s) => s.day === c.day)) continue;
    selected.push({ day: c.day, value: c.value });
  }

  selected.sort((a, b) => a.day - b.day);
  return selected;
}

// --- Category classification and chord-based turning point ---
export type GrowthCategory = "log" | "exp" | "other";

/**
 * Classify growth as logarithmic, exponential, or other using linear fits on
 * simple transforms:
 *  - linear: y ~ x
 *  - exponential: ln(y+1) ~ x
 *  - logarithmic: y ~ ln(x+1)
 */
export function classifyGrowth(
  points: Point[],
  options?: { r2Threshold?: number; r2Margin?: number },
): GrowthCategory {
  const n = points.length;
  if (n < 5) return "other";
  const r2Linear = computeR2(points);

  // Transform for exponential: ln(y+1) vs x
  const expPoints: Point[] = [];
  for (const p of points) {
    if (p.y < -0.999) return "other";
    expPoints.push({ x: p.x, y: Math.log(p.y + 1) });
  }
  const r2Exp = computeR2(expPoints);

  // Transform for logarithmic: y vs ln(x+1)
  const logPoints: Point[] = [];
  for (const p of points) {
    if (p.x < -0.999) return "other";
    logPoints.push({ x: Math.log(p.x + 1), y: p.y });
  }
  const r2Log = computeR2(logPoints);

  const threshold = options?.r2Threshold ?? 0.98;
  const margin = options?.r2Margin ?? 0.02; // must be this much better than linear

  const expBetter =
    r2Exp >= threshold && r2Exp >= r2Linear + margin && r2Exp >= r2Log;
  const logBetter =
    r2Log >= threshold && r2Log >= r2Linear + margin && r2Log >= r2Exp;

  if (expBetter) return "exp";
  if (logBetter) return "log";
  return "other";
}

/**
 * Turning point by chord method: select the point with maximum perpendicular
 * distance from the straight line connecting the first and last points.
 * Returns a single point or empty array if not applicable.
 */
export function chordTurningPoint(
  points: Point[],
): Array<{ day: number; value: number }> {
  const n = points.length;
  if (n < 3) return [];
  const p1 = points[0];
  const p2 = points[n - 1];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const denom = Math.sqrt(dx * dx + dy * dy) || 1;
  let bestIdx = -1;
  let bestDist = -1;
  for (let i = 1; i < n - 1; i++) {
    const p = points[i];
    const dist =
      Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / denom;
    if (dist > bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) return [];
  return [{ day: points[bestIdx].x, value: points[bestIdx].y }];
}

/**
 * Detect turning points based on category:
 *  - log/exp: chord method (max distance to first-last chord)
 *  - other: slope-change method (linear)
 */
export function detectTurningPointsByCategory(
  points: Point[],
  avgOverall: number,
  options?: {
    category?: GrowthCategory | "auto";
    r2Threshold?: number;
    r2Margin?: number;
    maxPoints?: number;
    minGapDays?: number;
  },
): Array<{ day: number; value: number }> {
  const cat =
    options?.category && options.category !== "auto"
      ? options.category
      : classifyGrowth(points, {
          r2Threshold: options?.r2Threshold,
          r2Margin: options?.r2Margin,
        });
  if (cat === "exp" || cat === "log") {
    return chordTurningPoint(points);
  }
  return detectTurningPoints(points, avgOverall, {
    maxPoints: options?.maxPoints,
    minGapDays: options?.minGapDays,
  });
}

// Internal helpers for turning-point detection
type TurningCandidate = {
  idx: number;
  day: number;
  value: number;
  score: number;
};

// Heuristic window size for estimating slope changes across the series.
function computeWindowSize(n: number): number {
  return Math.max(3, Math.min(14, Math.floor(n / 4)));
}

/**
 * Generate slope-change candidates by comparing the slope of a window
 * before an index vs the slope of a window after the index.
 * The candidate point is the NEXT sample (start of new slope).
 */
function slopeChangeCandidates(
  points: Point[],
  window?: number,
): TurningCandidate[] {
  const n = points.length;
  if (n < 7) return [];
  const w = window ?? computeWindowSize(n);
  const candidates: TurningCandidate[] = [];
  for (let i = w; i < n - w; i++) {
    const d0 = points[i - w].x;
    const d1 = points[i].x;
    const d2 = points[i + w].x;
    const v0 = points[i - w].y;
    const v1 = points[i].y;
    const v2 = points[i + w].y;
    const slopeBefore = (v1 - v0) / Math.max(1, d1 - d0);
    const slopeAfter = (v2 - v1) / Math.max(1, d2 - d1);
    const diff = Math.abs(slopeAfter - slopeBefore);
    const nextIdx = Math.min(i + 1, n - 1); // first point of the new slope
    candidates.push({
      idx: nextIdx,
      day: points[nextIdx].x,
      value: points[nextIdx].y,
      score: diff,
    });
  }
  return candidates;
}

/**
 * Select up to `maxPoints` significant candidates, spacing them by at least
 * `minGapDays` to avoid clustering and reduce noise.
 */
function selectTurningCandidates(
  candidates: TurningCandidate[],
  avgOverall: number,
  maxPoints: number,
  minGapDays: number,
): Array<{ day: number; value: number }> {
  const threshold = Math.max(0.2, 0.2 * Math.abs(avgOverall));
  const filtered = candidates.filter((c) => c.score >= threshold);
  filtered.sort((a, b) => b.score - a.score);
  const selected: Array<{ day: number; value: number }> = [];
  for (const c of filtered) {
    if (selected.length >= maxPoints) break;
    if (selected.some((s) => Math.abs(s.day - c.day) < minGapDays)) continue;
    if (selected.some((s) => s.day === c.day)) continue;
    selected.push({ day: c.day, value: c.value });
  }
  selected.sort((a, b) => a.day - b.day);
  return selected;
}

/**
 * Detect the strongest (single) turning point in the series. A turning point
 * is where the growth slope changes significantly. Returns null if none.
 */
export function detectTurningPoint(
  points: Point[],
  avgOverall: number,
): { day: number; value: number } | null {
  const n = points.length;
  if (n < 7) return null;
  const candidates = slopeChangeCandidates(points);
  const selected = selectTurningCandidates(
    candidates,
    avgOverall,
    1, // pick only the strongest
    Math.max(7, Math.floor(n / 10)),
  );
  return selected[0] ?? null;
}

/**
 * Detect multiple turning points in the time series.
 * - maxPoints: maximum points to return (default 3)
 * - minGapDays: minimum spacing between selected points to avoid clustering
 * - window: optional custom window size for slope comparison
 */
export function detectTurningPoints(
  points: Point[],
  avgOverall: number,
  options?: { maxPoints?: number; minGapDays?: number; window?: number },
): Array<{ day: number; value: number }> {
  const n = points.length;
  if (n < 7) return [];
  const maxPoints = options?.maxPoints ?? 3;
  const minGapDays = options?.minGapDays ?? Math.max(7, Math.floor(n / 10));
  const window = options?.window;
  const candidates = slopeChangeCandidates(points, window);
  return selectTurningCandidates(candidates, avgOverall, maxPoints, minGapDays);
}
