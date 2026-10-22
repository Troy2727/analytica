"use client";

import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/site/panel";
import { isHourly, withinTimeframe } from "@/lib/timeframe";
import type { PageView, Visit } from "@/types";

const SERIES = {
  pageViews: { label: "Page Views", color: "#34d399" },
  visits: { label: "Visitors", color: "#60a5fa" },
} satisfies ChartConfig;

type Series = keyof typeof SERIES;

interface Bucket {
  start: number; // ms timestamp of the hour or day the bucket covers
  pageViews: number;
  visits: number;
}

/** Start of the hour (or day) containing `iso`, in local time. */
function bucketStart(iso: string, hourly: boolean): number {
  const date = new Date(iso);
  date.setMinutes(0, 0, 0);
  if (!hourly) date.setHours(0);
  return date.getTime();
}

function buildBuckets(views: PageView[], visits: Visit[], hourly: boolean): Bucket[] {
  const buckets = new Map<number, Bucket>();
  const add = (iso: string, series: Series) => {
    const start = bucketStart(iso, hourly);
    const bucket = buckets.get(start) ?? { start, pageViews: 0, visits: 0 };
    bucket[series] += 1;
    buckets.set(start, bucket);
  };
  views.forEach((v) => add(v.created_at, "pageViews"));
  visits.forEach((v) => add(v.created_at, "visits"));
  return [...buckets.values()].sort((a, b) => a.start - b.start);
}

const hourLabel = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric" });
const shortDay = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const longDay = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function TrafficChart({
  pageViews,
  visits,
  timeframe,
}: {
  pageViews: PageView[];
  visits: Visit[];
  timeframe: string;
}) {
  const [series, setSeries] = useState<Series>("pageViews");
  const hourly = isHourly(timeframe);
  const data = useMemo(
    () => buildBuckets(withinTimeframe(pageViews, timeframe), withinTimeframe(visits, timeframe), hourly),
    [pageViews, visits, timeframe, hourly]
  );

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex justify-between text-base text-neutral-300 md:text-lg lg:text-xl">
          Analytics Graph
          <Eye className="h-7 w-7" />
        </CardTitle>
      </CardHeader>
      <CardContent className="-ml-12 -mr-2 flex pb-0">
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
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#9CA3AF" }} />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-navy-800 bg-navy-900 p-3 shadow-lg">
                    <p className="mb-2 text-neutral-300">{(hourly ? hourLabel : longDay)(Number(label))}</p>
                    {payload.map((item) => (
                      <p key={String(item.dataKey)} className="flex items-center gap-2 text-neutral-300">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}: {item.value}
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Area
              key={series}
              dataKey={series}
              name={SERIES[series].label}
              type="linear"
              stroke={SERIES[series].color}
              fill={SERIES[series].color}
              fillOpacity={0.4}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <Tabs value={series} onValueChange={(value) => setSeries(value as Series)} className="w-full px-6 pb-6 pt-4">
        <TabsList className="grid w-full grid-cols-2 border border-navy-900 bg-navy-900/30 p-1 backdrop-blur-sm">
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
