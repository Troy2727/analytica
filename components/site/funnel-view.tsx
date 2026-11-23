"use client";

import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { compactNumber, formatRate } from "@/lib/format";
import type { FunnelStats, FunnelStep } from "@/lib/goals";

const PLOT_HEIGHT = 224;
const MIN_BAR = 8;
const grouped = (n: number) => n.toLocaleString("en-US");

/** The outcome text for one step: short form always, full form on hover/focus. */
function outcome(step: FunnelStep, index: number, last: boolean, stats: FunnelStats) {
  if (index === 0) {
    return {
      short: `→ ${formatRate(stats.entryShare)}`,
      lines: [`→ ${formatRate(stats.entryShare)} entered (${grouped(step.visitors)})`],
    };
  }
  const mark = last ? "✓" : "→";
  const verb = last ? "converted" : "continued";
  return {
    short: `${mark} ${formatRate(step.rateFromPrevious)} ↓ ${formatRate(step.droppedPercent)}`,
    lines: [
      `${mark} ${formatRate(step.rateFromPrevious)} ${verb} (${grouped(step.visitors)})`,
      `↓ ${formatRate(step.droppedPercent)} dropped off (${grouped(step.droppedCount ?? 0)})`,
    ],
  };
}

/** Bar height for `visitors` relative to step 1 (back bars may be 0, front bars keep a sliver). */
const barHeight = (visitors: number, first: number, min: number) =>
  Math.max(min, first ? (visitors / first) * PLOT_HEIGHT : 0);

/** One column per step: visitors as a bar against the previous step's, with the outcome chip. */
export function FunnelChart({ stats, chartKey }: { stats: FunnelStats; chartKey: string }) {
  // Bars grow from 0 when a funnel is shown.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [chartKey]);

  const first = stats.steps[0]?.visitors ?? 0;
  return (
    <div>
      <div
        className="-mx-5 grid auto-cols-[minmax(192px,1fr)] grid-flow-col gap-4 overflow-x-auto px-5 pb-2 [scrollbar-color:theme(colors.navy.700)_transparent] [scrollbar-width:thin]"
        role="list"
        aria-label="Funnel steps"
      >
        {stats.steps.map((step, index) => {
          const last = index === stats.steps.length - 1;
          const text = outcome(step, index, last, stats);
          const name = `Visit ${step.pattern}`;
          const back = index ? barHeight(stats.steps[index - 1].visitors, first, 0) : 0;
          const front = barHeight(step.visitors, first, MIN_BAR);
          return (
            <div
              key={index}
              role="listitem"
              tabIndex={0}
              aria-label={`Step ${index + 1}, ${name}: ${grouped(step.visitors)} visitors, ${text.lines.join(", ")}`}
              className="group min-w-0 rounded-md border-l border-navy-800 pl-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <p title={name} className="truncate text-xs font-medium text-neutral-300">
                {name}
              </p>
              <p className="text-base font-semibold text-white">{formatRate(step.rateFromFirst)}</p>
              <p className="text-xs font-medium text-neutral-500">{compactNumber(step.visitors)} visitors</p>
              <div className="relative mt-3" style={{ height: PLOT_HEIGHT }}>
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 rounded-t-md bg-navy-800/60 transition-[height] duration-500 ease-out motion-reduce:transition-none"
                  style={{ height: grown ? back : 0 }}
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 overflow-hidden rounded-md bg-gradient-to-b from-blue-400/80 to-emerald-400/80 transition-[height] duration-500 ease-out motion-reduce:transition-none"
                  style={{ height: grown ? front : 0 }}
                >
                  <div className="absolute inset-0 transition-colors duration-150 group-hover:bg-white/10 group-focus-visible:bg-white/10" />
                </div>
                <div className="absolute bottom-1 left-1 max-w-[calc(100%-8px)] cursor-default overflow-hidden rounded-md bg-navy-950/70 px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-white/10 backdrop-blur-[4px]">
                  <p className="font-medium text-white group-focus-within:hidden group-hover:hidden">{text.short}</p>
                  <div className="hidden group-focus-within:block group-hover:block">
                    {text.lines.map((line, i) => (
                      <p key={line} className={i ? "text-neutral-400" : "font-medium text-white"}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {first === 0 && <p className="mt-2 text-xs text-neutral-500">No sessions reached the first step in this range.</p>}
    </div>
  );
}

/** "3-step funnel | Sequential (i) | Conversion rate: 25%" */
export function FunnelMeta({ stats }: { stats: FunnelStats }) {
  const separator = <span className="select-none text-neutral-700">|</span>;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-neutral-500">
      <span>{stats.steps.length}-step funnel</span>
      {separator}
      <span className="flex items-center gap-1">
        Sequential
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="About funnel type"
                className="rounded text-neutral-500 hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              All steps are required, in order. Other pages may be viewed between steps. Visitors are tracked sessions.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
      {separator}
      <span>
        Conversion rate: <span className="text-sm font-semibold text-white">{formatRate(stats.overall)}</span>
      </span>
    </div>
  );
}
