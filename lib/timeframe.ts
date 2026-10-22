/** Timeframes offered on the site page. `value` is what the select stores. */
export const TIMEFRAMES = [
  { value: "0", label: "Lifetime", hours: Infinity },
  { value: "last 1 hour", label: "Last 1 hour", hours: 1 },
  { value: "last 1 day", label: "Last 1 day", hours: 24 },
  { value: "last 7 days", label: "Last 7 days", hours: 24 * 7 },
  { value: "last 30 days", label: "Last 30 days", hours: 24 * 30 },
  { value: "last 90 days", label: "Last 90 days", hours: 24 * 90 },
  { value: "last 365 days", label: "Last 365 days", hours: 24 * 365 },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number]["value"];

const HOUR_MS = 60 * 60 * 1000;

function hoursIn(timeframe: string): number {
  return TIMEFRAMES.find((t) => t.value === timeframe)?.hours ?? Infinity;
}

/** Earliest timestamp inside the timeframe, or null for "Lifetime". */
export function timeframeStart(timeframe: string, now = Date.now()): Date | null {
  const hours = hoursIn(timeframe);
  return Number.isFinite(hours) ? new Date(now - hours * HOUR_MS) : null;
}

/** Keep only rows created within the timeframe. */
export function withinTimeframe<T extends { created_at: string }>(
  rows: T[],
  timeframe: string,
  now = Date.now()
): T[] {
  const start = timeframeStart(timeframe, now);
  return start ? rows.filter((row) => new Date(row.created_at) >= start) : rows;
}

/** True for timeframes short enough to chart by hour instead of by day. */
export function isHourly(timeframe: string): boolean {
  return hoursIn(timeframe) <= 24;
}
