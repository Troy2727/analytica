"use client";

import { Eye } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeBadge } from "@/components/site/change-badge";
import { Panel } from "@/components/site/panel";
import { METRICS, type Metric } from "@/lib/analytics";
import { type Bucket, buildBuckets, type ComparedBucket, mergeBuckets, previousBucketMoment, shiftRows } from "@/lib/buckets";
import { changeOf } from "@/lib/compare";
import { formatDuration } from "@/lib/format";
import type { PeriodData } from "@/lib/queries";
import { isHourly, withinTimeframe } from "@/lib/timeframe";
import type { PageView, Visit } from "@/types";

// Tab order; the first two keep their original colors.
const SERIES = {
  pageViews: { label: METRICS.pageViews.label, color: "#34d399" },
  visits: { label: METRICS.visits.label, color: "#60a5fa" },
  bounceRate: { label: METRICS.bounceRate.label, color: "#a78bfa" },
  visitDuration: { label: METRICS.visitDuration.label, color: "#2dd4bf" },
} satisfies ChartConfig & Record<Metric, unknown>;

export type Series = Metric;

/** The previous period, ready to draw: its rows and how far to shift them onto the current window. */
export interface ChartComparison {
  previous: PeriodData;
  windowMs: number;
  asOf: number;
}

/** Per-series Y axis: bounce is a fixed 0-100% scale, duration is formatted as time. */
const Y_AXIS: Partial<Record<Series, { width: number; domain?: [number, number]; ticks?: number[]; format: (v: number) => string }>> = {
  bounceRate: { width: 48, domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100], format: (v) => `${v}%` },
  visitDuration: { width: 76, format: (v) => formatDuration(v) },
};

const hourLabel = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric" });
const shortDay = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const longDay = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function TrafficChart({
  pageViews,
  visits,
  timeframe,
  series,
  onSeriesChange,
  comparison,
}: {
  pageViews: PageView[];
  visits: Visit[];
  timeframe: string;
  series: Series;
  onSeriesChange: (series: Series) => void;
  comparison?: ChartComparison | null;
}) {
  const hourly = isHourly(timeframe);
  const data: (Bucket | ComparedBucket)[] = useMemo(() => {
    const asOf = comparison?.asOf;
    const current = buildBuckets(withinTimeframe(pageViews, timeframe, asOf), withinTimeframe(visits, timeframe, asOf), hourly);
    if (!comparison) return current;
    const { previous, windowMs } = comparison;
    return mergeBuckets(
      current,
      buildBuckets(shiftRows(previous.pageViews, windowMs), shiftRows(previous.visits, windowMs), hourly)
    );
  }, [pageViews, visits, timeframe, hourly, comparison]);

  const yAxis = Y_AXIS[series];
  const previousKey = `prev_${series}` as const;
  const noSessionData =
    Boolean(yAxis) && data.every((b) => b[series] === null && (!comparison || (b as ComparedBucket)[previousKey] === null));
  const label = hourly ? hourLabel : longDay;
  const metric = METRICS[series];
  const previousLabel = (start: number) => label(previousBucketMoment(start, comparison!.windowMs, hourly));

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex justify-between text-base text-neutral-300 md:text-lg lg:text-xl">
          Analytics Graph
          <Eye className="h-7 w-7" />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative -ml-12 -mr-2 flex pb-0">
        {noSessionData && (
          <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pl-12 text-sm text-neutral-400">
            No session data yet for this range
          </p>
        )}
        <ChartContainer config={SERIES} className="max-h-[500px] min-h-[200px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="#374151" />
            <XAxis
              dataKey="start"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: "#9CA3AF" }}
              tickFormatter={hourly ? hourLabel : shortDay}
            />
            <YAxis
              key={`y-${series}`}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              width={yAxis?.width ?? 60}
              domain={yAxis?.domain ?? [0, "auto"]}
              ticks={yAxis?.ticks}
              tickFormatter={yAxis?.format}
            />
            <ChartTooltip
              cursor={{ stroke: "#525252", strokeWidth: 1 }}
              content={({ active, payload, label: start }) => {
                if (!active || !payload?.length) return null;
                const bucket = payload[0].payload as ComparedBucket;
                const color = SERIES[series].color;
                if (!comparison) {
                  return (
                    <div className="rounded-md border border-navy-800 bg-navy-900 px-3 py-2 shadow-lg">
                      <p className="mb-1 text-sm text-neutral-300">{label(Number(start))}</p>
                      <p className="text-xs font-semibold uppercase text-neutral-400">{metric.label}</p>
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        {metric.format(bucket[series])}
                      </p>
                    </div>
                  );
                }
                const now = bucket[series];
                const before = bucket[previousKey];
                return (
                  <div
                    data-testid="chart-tooltip"
                    className="min-w-[200px] max-w-[220px] space-y-2 rounded-md border border-navy-800 bg-navy-900 px-3 py-2 shadow-lg sm:max-w-[300px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase text-neutral-300">{metric.label}</span>
                      <ChangeBadge
                        change={changeOf(metric.changeKind, now, before)}
                        kind={metric.changeKind}
                        lowerIsBetter={metric.lowerIsBetter}
                      />
                    </div>
                    {[
                      { key: "current", when: label(bucket.start), value: now, opacity: 1 },
                      { key: "previous", when: previousLabel(bucket.start), value: before, opacity: 0.45 },
                    ].map((row) => (
                      <p key={row.key} className="flex items-center justify-between gap-3 text-sm text-neutral-300">
                        <span className="flex items-center">
                          <span className="mr-2 size-2 rounded-full" style={{ backgroundColor: color, opacity: row.opacity }} />
                          {row.when}
                        </span>
                        <span className="font-bold text-white">{metric.format(row.value)}</span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {comparison && (
              <Area
                key={`prev-${series}`}
                dataKey={previousKey}
                name={`Previous ${SERIES[series].label}`}
                type="linear"
                stroke={SERIES[series].color}
                strokeOpacity={0.45}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={SERIES[series].color}
                fillOpacity={0.12}
                activeDot={{ r: 2.5, fill: SERIES[series].color, fillOpacity: 0.45 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
            <Area
              key={series}
              dataKey={series}
              name={SERIES[series].label}
              type="linear"
              stroke={SERIES[series].color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={SERIES[series].color}
              fillOpacity={0.4}
              activeDot={{ r: 2.5, fill: SERIES[series].color }}
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <Tabs value={series} onValueChange={(value) => onSeriesChange(value as Series)} className="w-full px-6 pb-6 pt-4">
        <TabsList className="grid h-auto w-full grid-cols-2 border border-navy-900 bg-navy-900/30 p-1 backdrop-blur-sm sm:grid-cols-4">
          {(Object.keys(SERIES) as Series[]).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-navy-800 data-[state=active]:text-white"
            >
              {SERIES[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </Panel>
  );
}
