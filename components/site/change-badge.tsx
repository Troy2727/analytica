import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { type ChangeKind, changeTone, formatChange } from "@/lib/compare";
import { cn } from "@/lib/utils";

const TONE_CLASS = { good: "text-emerald-400", bad: "text-red-400", neutral: "text-neutral-400" };

/** "↗ 12%" colored by whether the change is good for the metric. Renders nothing without a change. */
export function ChangeBadge({
  change,
  kind,
  lowerIsBetter,
  className,
}: {
  change: number | null;
  kind: ChangeKind;
  lowerIsBetter: boolean;
  className?: string;
}) {
  if (change === null) return null;
  const tone = changeTone(change, lowerIsBetter);
  const Arrow = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : null;
  const unit = kind === "points" ? "percentage points" : "percent";
  const spoken = change
    ? `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} ${unit} versus the previous period, ${tone === "good" ? "better" : "worse"}`
    : "No change versus the previous period";

  return (
    <span className={cn("inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium", TONE_CLASS[tone], className)}>
      {Arrow && <Arrow aria-hidden className="-mt-0.5 size-2.5" strokeWidth={1.5} />}
      <span aria-hidden>{formatChange(change, kind)}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}
