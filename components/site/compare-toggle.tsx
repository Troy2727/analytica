import { GitCompareArrows } from "lucide-react";
import type { Comparison } from "@/hooks/useComparison";
import { formatRange } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The "Compare" button and, when on, which two periods are compared and whether the earlier one loaded. */
export function CompareToggle({ comparison }: { comparison: Comparison }) {
  const { available, enabled, onToggle, status, previous, windows, onRetry } = comparison;
  const on = enabled && available;
  const emptyPrevious = status === "ready" && previous && !previous.pageViews.length && !previous.visits.length;

  return (
    <div className="mb-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-4 text-xs font-medium">
        {on && windows && (
          <p className="flex flex-wrap gap-x-1.5">
            <span className="text-neutral-200" title={`${new Date(windows.currentStart).toLocaleString()} – ${new Date(windows.currentEnd).toLocaleString()}`}>
              {formatRange(windows.currentStart, windows.currentEnd)}
            </span>
            <span className="text-neutral-500">vs.</span>
            <span className="text-neutral-500" title={`${new Date(windows.previousStart).toLocaleString()} – ${new Date(windows.previousEnd).toLocaleString()}`}>
              {formatRange(windows.previousStart, windows.previousEnd)}
            </span>
          </p>
        )}
        {on && status === "loading" && <p className="mt-1 text-neutral-500">Loading previous period...</p>}
        {on && status === "error" && (
          <p className="mt-1 text-red-400">
            Could not load the previous period.{" "}
            <button type="button" onClick={onRetry} className="hover:underline focus-visible:underline focus-visible:outline-none">
              Retry
            </button>
          </p>
        )}
        {on && emptyPrevious && <p className="mt-1 text-neutral-500">No traffic in the previous period</p>}
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        {!available && (
          <span id="compare-unavailable" className="text-xs text-neutral-500">
            Not available for Lifetime
          </span>
        )}
        <button
          type="button"
          aria-pressed={on}
          aria-disabled={!available}
          aria-describedby={available ? undefined : "compare-unavailable"}
          onClick={onToggle}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            on
              ? "border-navy-800 bg-navy-800 text-white hover:bg-navy-800/80"
              : "border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80",
            !available && "cursor-not-allowed opacity-50 hover:bg-navy-900/20"
          )}
        >
          <GitCompareArrows className="size-4" strokeWidth={1.5} />
          Compare
        </button>
      </div>
    </div>
  );
}
