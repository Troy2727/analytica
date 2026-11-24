/** How a metric's change is measured: percent change, or percentage points for rates. */
export type ChangeKind = "relative" | "points";

export type ChangeTone = "good" | "bad" | "neutral";

/** Change from `previous` to `current` as a whole number, or null when either side has no data. */
export function changeOf(kind: ChangeKind, current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (kind === "points") return Math.round(current - previous) || 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  const raw = ((current - previous) / previous) * 100;
  return Math.sign(raw) * Math.round(Math.abs(raw)) || 0; // half away from zero, never -0
}

/** A rise is good unless lower is better for the metric (bounce rate). */
export function changeTone(change: number | null, lowerIsBetter: boolean): ChangeTone {
  if (!change) return "neutral";
  return change > 0 !== lowerIsBetter ? "good" : "bad";
}

/** Badge text without a sign (the arrow shows direction): "12%", "8 pp", "999%+". */
export function formatChange(change: number, kind: ChangeKind): string {
  const size = Math.abs(change);
  if (kind === "points") return `${size} pp`;
  return size >= 1000 ? "999%+" : `${size}%`;
}
