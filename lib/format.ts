/** 950 -> "950", 1234 -> "1.23K", 2500000 -> "2.50M"; fractions keep two decimals. */
export function compactNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  return `${day}${{ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th"}`;
}

/** "2026-10-05T..." -> "October 5th, 2026" */
export function longDate(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${month} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}

/** Seconds as "7s", "1m 30s", "2m 04s" or "1h 5m 3s"; "—" for no data. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** A conversion rate: 12.5 -> "12.5%", 38 -> "38%", 0.03 -> "<0.1%"; "—" for no data. */
export function formatRate(value: number | null): string {
  if (value === null) return "—";
  if (value > 0 && value < 0.05) return "<0.1%";
  return `${Math.round(value * 10) / 10}%`;
}

/** 57.5 -> "58%"; "—" for no data. */
export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

/**
 * A time window for the comparison legend: "Nov 16 – Nov 23", or with times
 * ("Nov 22, 2:00 PM – Nov 23, 2:00 PM") for windows of a day or less.
 */
export function formatRange(start: number, end: number): string {
  const withTime = end - start <= 24 * 60 * 60 * 1000;
  const format = (ms: number) =>
    new Date(ms).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    });
  return `${format(start)} – ${format(end)}`;
}

/** "mobile" -> "Mobile" */
export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
