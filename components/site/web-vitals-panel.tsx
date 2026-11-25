"use client";

import { Gauge } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/site/panel";
import { pathOf } from "@/lib/analytics";
import { bucketStart } from "@/lib/buckets";
import { capitalize, compactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  formatVital,
  groupVitals,
  type Percentile,
  PERCENTILES,
  percentile,
  rate,
  type Rating,
  summarize,
  VITAL_KEYS,
  type VitalKey,
  VITALS,
  valuesOf,
} from "@/lib/web-vitals";
import type { WebVital } from "@/types";

const RATING: Record<Rating, { label: string; dot: string; pill: string }> = {
  good: { label: "Good", dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400" },
  "needs-improvement": { label: "Needs work", dot: "bg-amber-400", pill: "bg-amber-500/15 text-amber-400" },
  poor: { label: "Poor", dot: "bg-red-400", pill: "bg-red-500/15 text-red-400" },
};

const BREAKDOWNS = {
  pages: { label: "Pages", of: (row: WebVital) => `/${pathOf(row.page)}` },
  devices: { label: "Devices", of: (row: WebVital) => capitalize(row.device_type || "Unknown") },
  browsers: { label: "Browsers", of: (row: WebVital) => row.browser_name || "Unknown" },
  countries: { label: "Countries", of: (row: WebVital) => row.country || "Unknown" },
};
type Breakdown = keyof typeof BREAKDOWNS;

const LINE_COLOR = "#60a5fa";
const CHART_CONFIG = { value: { label: "Value", color: LINE_COLOR } } satisfies ChartConfig;
const shortDay = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const segment = (active: boolean) =>
  cn(
    "h-7 rounded px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-navy-800 text-white" : "text-neutral-400 hover:text-white"
  );

function RatingDot({ rating }: { rating: Rating | null }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", rating ? RATING[rating].dot : "bg-neutral-600")} />;
}

function VitalTile({
  vital,
  rows,
  p,
  selected,
  onSelect,
}: {
  vital: VitalKey;
  rows: WebVital[];
  p: Percentile;
  selected: boolean;
  onSelect: () => void;
}) {
  const { value, rating, goodShare, samples } = summarize(rows, vital, p);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-blue-400/40 bg-navy-800/70" : "border-navy-800 bg-navy-900/40 hover:bg-navy-800/50"
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-200">{VITALS[vital].label}</span>
        <span className="hidden truncate text-[11px] text-neutral-500 sm:inline">{VITALS[vital].name}</span>
      </span>
      <span className="text-2xl font-bold tracking-tight text-white">{formatVital(vital, value)}</span>
      {rating ? (
        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", RATING[rating].pill)}>
          <RatingDot rating={rating} />
          {RATING[rating].label}
        </span>
      ) : (
        <span className="text-xs text-neutral-500">Not measured yet</span>
      )}
      {goodShare !== null && (
        <span className="space-y-1">
          <span className="block h-1 overflow-hidden rounded-full bg-navy-800">
            <span className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${goodShare}%` }} />
          </span>
          <span className="block text-xs text-neutral-400">
            {goodShare}% of {compactNumber(samples)} loads good
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Core Web Vitals measured in visitors' browsers: a tile per metric at the chosen
 * percentile, the selected metric per day against its thresholds, and a breakdown table.
 */
export function WebVitalsPanel({ rows }: { rows: WebVital[] }) {
  const [p, setP] = useState<Percentile>(75);
  const [vital, setVital] = useState<VitalKey>("lcp");
  const [breakdown, setBreakdown] = useState<Breakdown>("pages");

  const daily = useMemo(() => {
    const days = groupVitals(rows, (row) => String(bucketStart(row.created_at, false)));
    return days
      .map(({ label, rows: dayRows }) => ({ start: Number(label), value: percentile(valuesOf(dayRows, vital), p) }))
      .filter((day) => day.value !== null)
      .sort((a, b) => a.start - b.start);
  }, [rows, vital, p]);

  const groups = useMemo(() => groupVitals(rows, BREAKDOWNS[breakdown].of).slice(0, 20), [rows, breakdown]);
  const info = VITALS[vital];
  const format = (v: number) => formatVital(vital, v);

  return (
    <Panel>
      <CardHeader className="flex flex-col gap-4 border-b border-navy-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Gauge aria-hidden className="size-5 text-blue-400" />
            Real-user Web Vitals
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Measured in your visitors&apos; browsers{rows.length > 0 && ` · ${compactNumber(rows.length)} page loads`}
          </CardDescription>
        </div>
        {rows.length > 0 && (
          <div role="group" aria-label="Percentile" className="flex w-fit gap-1 rounded-md border border-navy-800 bg-navy-900/40 p-1">
            {PERCENTILES.map((value) => (
              <button key={value} type="button" aria-pressed={p === value} onClick={() => setP(value)} className={segment(p === value)}>
                p{value}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {rows.length === 0 ? (
        <CardContent className="py-10 text-center">
          <p className="text-neutral-300">No real-user measurements yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            The tracking script reports LCP, INP, CLS, FCP and TTFB automatically when a visitor leaves a page.
          </p>
        </CardContent>
      ) : (
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {VITAL_KEYS.map((key) => (
              <VitalTile key={key} vital={key} rows={rows} p={p} selected={vital === key} onSelect={() => setVital(key)} />
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm text-neutral-400">
              {info.name}, p{p} per day
              <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span aria-hidden className="w-4 border-t border-dashed border-emerald-400" />
                Good ≤ {format(info.good)}
              </span>
              <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-red-400">
                <span aria-hidden className="w-4 border-t border-dashed border-red-400" />
                Poor &gt; {format(info.poor)}
              </span>
            </p>
            <ChartContainer config={CHART_CONFIG} className="h-[240px] w-full">
              <LineChart data={daily} margin={{ left: 4, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#374151" />
                <XAxis dataKey="start" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#9CA3AF" }} tickFormatter={shortDay} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  domain={[0, (max: number) => Math.max(max, info.poor) * 1.1]}
                  tickFormatter={format}
                />
                <ReferenceLine y={info.good} stroke="#34d399" strokeDasharray="5 5" />
                <ReferenceLine y={info.poor} stroke="#f87171" strokeDasharray="5 5" />
                <ChartTooltip
                  cursor={{ stroke: "#525252", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const day = payload[0].payload as { start: number; value: number };
                    return (
                      <div className="rounded-md border border-navy-800 bg-navy-900 px-3 py-2 shadow-lg">
                        <p className="mb-1 text-sm text-neutral-300">{shortDay(day.start)}</p>
                        <p className="flex items-center gap-2 text-sm font-bold text-white">
                          <RatingDot rating={rate(vital, day.value)} />
                          {info.label} p{p}: {format(day.value)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line dataKey="value" type="monotone" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 2.5, fill: LINE_COLOR }} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </div>

          <div>
            <Tabs value={breakdown} onValueChange={(value) => setBreakdown(value as Breakdown)}>
              <TabsList className="mb-3 grid h-auto w-full grid-cols-4 border border-navy-900 bg-navy-900/30 p-1 sm:w-fit">
                {(Object.keys(BREAKDOWNS) as Breakdown[]).map((key) => (
                  <TabsTrigger key={key} value={key} className="px-3 data-[state=active]:bg-navy-800 data-[state=active]:text-white">
                    {BREAKDOWNS[key].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="overflow-x-auto rounded-lg border border-navy-800">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-navy-800 text-left text-xs font-medium text-neutral-500">
                    <th scope="col" className="px-3 py-2 font-medium">
                      {BREAKDOWNS[breakdown].label.replace(/s$/, "")}
                    </th>
                    {VITAL_KEYS.map((key) => (
                      <th key={key} scope="col" className="px-3 py-2 text-right font-medium">
                        {VITALS[key].label}
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Loads
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.label} className="border-b border-navy-900 last:border-0 hover:bg-navy-900/40">
                      <td className="max-w-[220px] truncate px-3 py-2 text-neutral-100" title={group.label}>
                        {group.label}
                      </td>
                      {VITAL_KEYS.map((key) => {
                        const s = summarize(group.rows, key, p);
                        return (
                          <td key={key} className="whitespace-nowrap px-3 py-2 text-right text-neutral-200">
                            <span className="inline-flex items-center gap-1.5">
                              <RatingDot rating={s.rating} />
                              {formatVital(key, s.value)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right text-neutral-400">{compactNumber(group.rows.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      )}
    </Panel>
  );
}
