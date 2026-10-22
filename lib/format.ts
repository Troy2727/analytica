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

/** "mobile" -> "Mobile" */
export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
