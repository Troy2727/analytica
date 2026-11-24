// Real-user Core Web Vitals: validating what the tracking script sends, and
// summarizing stored rows for the Performance tab.

import type { WebVital } from "@/types";

export type VitalKey = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export type Rating = "good" | "needs-improvement" | "poor";
export type Percentile = 50 | 75 | 90 | 99;

export const PERCENTILES: Percentile[] = [50, 75, 90, 99];

interface VitalInfo {
  label: string;
  name: string;
  column: "lcp_ms" | "inp_ms" | "cls" | "fcp_ms" | "ttfb_ms";
  /** Upper bounds of "good" and "needs improvement" (Google's published thresholds). */
  good: number;
  poor: number;
  unit: "ms" | "score";
}

export const VITALS: Record<VitalKey, VitalInfo> = {
  lcp: { label: "LCP", name: "Largest Contentful Paint", column: "lcp_ms", good: 2500, poor: 4000, unit: "ms" },
  inp: { label: "INP", name: "Interaction to Next Paint", column: "inp_ms", good: 200, poor: 500, unit: "ms" },
  cls: { label: "CLS", name: "Cumulative Layout Shift", column: "cls", good: 0.1, poor: 0.25, unit: "score" },
  fcp: { label: "FCP", name: "First Contentful Paint", column: "fcp_ms", good: 1800, poor: 3000, unit: "ms" },
  ttfb: { label: "TTFB", name: "Time to First Byte", column: "ttfb_ms", good: 800, poor: 1800, unit: "ms" },
};

export const VITAL_KEYS = Object.keys(VITALS) as VitalKey[];

export function rate(key: VitalKey, value: number): Rating {
  const { good, poor } = VITALS[key];
  if (value <= good) return "good";
  return value <= poor ? "needs-improvement" : "poor";
}

/** "1.24 s" / "180 ms" / "0.08". */
export function formatVital(key: VitalKey, value: number | null): string {
  if (value === null) return "—";
  if (VITALS[key].unit === "score") return value.toFixed(2);
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

/** Nearest-rank percentile of `values` (unsorted), or null when empty. */
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

const valueOf = (row: WebVital, key: VitalKey): number | null => {
  const raw = row[VITALS[key].column];
  if (raw === null || raw === undefined) return null;
  const n = Number(raw); // NUMERIC columns arrive as strings
  return Number.isFinite(n) ? n : null;
};

export const valuesOf = (rows: WebVital[], key: VitalKey): number[] =>
  rows.flatMap((row) => {
    const v = valueOf(row, key);
    return v === null ? [] : [v];
  });

export interface VitalSummary {
  value: number | null; // at the chosen percentile
  rating: Rating | null;
  goodShare: number | null; // whole-number percent of measured loads rated good
  samples: number;
}

export function summarize(rows: WebVital[], key: VitalKey, p: Percentile): VitalSummary {
  const values = valuesOf(rows, key);
  const value = percentile(values, p);
  return {
    value,
    rating: value === null ? null : rate(key, value),
    goodShare: values.length ? Math.round((values.filter((v) => rate(key, v) === "good").length / values.length) * 100) : null,
    samples: values.length,
  };
}

/** Rows grouped by a label (page path, device...), most loads first. */
export function groupVitals(rows: WebVital[], labelOf: (row: WebVital) => string): { label: string; rows: WebVital[] }[] {
  const groups = new Map<string, WebVital[]>();
  for (const row of rows) {
    const label = labelOf(row);
    const group = groups.get(label) ?? [];
    group.push(row);
    groups.set(label, group);
  }
  return [...groups].map(([label, rows]) => ({ label, rows })).sort((a, b) => b.rows.length - a.rows.length);
}

// --- Validating a `web_vitals` request from the tracking script ---

const MAX_MS = 120_000;
const MAX_CLS = 100;

const clean = (value: unknown, max: number, round: boolean): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) return null;
  return round ? Math.round(value) : Math.round(value * 10_000) / 10_000;
};

/** The metric columns to store, or null when no metric is usable. Out-of-range values are dropped. */
export function parseVitals(body: { lcp?: unknown; inp?: unknown; cls?: unknown; fcp?: unknown; ttfb?: unknown }) {
  const row = {
    lcp_ms: clean(body.lcp, MAX_MS, true),
    inp_ms: clean(body.inp, MAX_MS, true),
    cls: clean(body.cls, MAX_CLS, false),
    fcp_ms: clean(body.fcp, MAX_MS, true),
    ttfb_ms: clean(body.ttfb, MAX_MS, true),
  };
  return Object.values(row).some((v) => v !== null) ? row : null;
}
