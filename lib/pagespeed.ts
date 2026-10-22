import type { PerformanceMetrics } from "@/types";

/** The four Lighthouse category scores (0-100), shown as rings. */
export const SCORE_METRICS: { key: keyof PerformanceMetrics; label: string }[] = [
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "bestPractices", label: "Best Practices" },
  { key: "seo", label: "SEO" },
];

/** Lab timings, shown as cards. `unit: "ms"` values display in seconds. */
export const TIMING_METRICS: { key: keyof PerformanceMetrics; label: string; unit: "ms" | "score" }[] = [
  { key: "firstContentfulPaint", label: "First Contentful Paint", unit: "ms" },
  { key: "largestContentfulPaint", label: "Largest Contentful Paint", unit: "ms" },
  { key: "timeToInteractive", label: "Time to Interactive", unit: "ms" },
  { key: "totalBlockingTime", label: "Total Blocking Time", unit: "ms" },
  { key: "cumulativeLayoutShift", label: "Cumulative Layout Shift", unit: "score" },
  { key: "speedIndex", label: "Speed Index", unit: "ms" },
];

export function formatMetric(value: number, unit: "ms" | "score"): string {
  return unit === "ms" ? `${(value / 1000).toFixed(2)}s` : value.toFixed(3);
}

export interface Grade {
  label: string;
  passing: boolean;
  text: string; // Tailwind text color
  badge: string; // Tailwind background
}

const GRADES: [minimum: number, grade: Grade][] = [
  [90, { label: "EXCELLENT", passing: true, text: "text-green-500", badge: "bg-green-500/20" }],
  [80, { label: "GOOD", passing: true, text: "text-blue-500", badge: "bg-blue-500/20" }],
  [70, { label: "AVERAGE", passing: false, text: "text-yellow-500", badge: "bg-yellow-500/20" }],
  [50, { label: "POOR", passing: false, text: "text-orange-500", badge: "bg-orange-500/20" }],
  [0, { label: "CRITICAL", passing: false, text: "text-red-500", badge: "bg-red-500/20" }],
];

export function grade(score: number): Grade {
  return GRADES.find(([minimum]) => score >= minimum)![1];
}

/** Mean of the four category scores, rounded. */
export function overallScore(m: PerformanceMetrics): number {
  return Math.round((m.performance + m.accessibility + m.bestPractices + m.seo) / 4);
}

export interface Recommendation {
  icon: string;
  title: string;
  advice: string;
  value: string;
}

/** Plain-language fixes for every metric past Google's "needs improvement" line. */
export function recommendations(m: PerformanceMetrics): Recommendation[] {
  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const rules: [failing: boolean, rec: Recommendation][] = [
    [m.performance < 90, { icon: "⚡", title: "Speed Optimization", advice: "Compress images and cache static assets", value: String(m.performance) }],
    [m.firstContentfulPaint > 1800, { icon: "🎨", title: "First Contentful Paint", advice: "Cut server response time and render-blocking CSS and scripts", value: seconds(m.firstContentfulPaint) }],
    [m.accessibility < 90, { icon: "♿", title: "Accessibility", advice: "Add ARIA labels and raise color contrast", value: String(m.accessibility) }],
    [m.cumulativeLayoutShift > 0.1, { icon: "📏", title: "Layout Stability", advice: "Give images and embeds explicit sizes so content doesn't jump", value: m.cumulativeLayoutShift.toFixed(3) }],
    [m.seo < 90, { icon: "🔍", title: "SEO Optimization", advice: "Add meta descriptions and a clear heading structure", value: String(m.seo) }],
    [m.totalBlockingTime > 300, { icon: "⌛", title: "Interactivity", advice: "Run less JavaScript up front and split long tasks", value: seconds(m.totalBlockingTime) }],
  ];
  return rules.filter(([failing]) => failing).map(([, rec]) => rec);
}
