import type { LucideIcon } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/site/panel";
import { cn } from "@/lib/utils";

/**
 * A headline number with an icon and label, e.g. "Page Views 1.2K". With `onSelect`
 * it becomes a toggle button that picks the chart series.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  selected = false,
  onSelect,
  compare,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  selected?: boolean;
  onSelect?: () => void;
  /** Comparison with the previous period: still loading, or a change badge and the earlier value. */
  compare?: "loading" | { badge: React.ReactNode; previous: string };
}) {
  const content = (
    <>
      <span className="flex items-center gap-2">
        <Icon className="h-6 w-6 shrink-0" />
        <span
          className={cn(
            "text-sm text-neutral-500 transition-colors duration-150",
            onSelect && "group-hover:text-neutral-200",
            selected && "text-neutral-200"
          )}
        >
          {label}
        </span>
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="whitespace-nowrap text-base font-bold tracking-tight text-white md:text-lg">{value}</span>
        {compare && compare !== "loading" && compare.badge && <span data-testid="stat-change">{compare.badge}</span>}
      </span>
      {compare === "loading" && <span aria-hidden className="mt-1 block h-5 w-16 animate-pulse rounded bg-navy-800/60" />}
      {compare && compare !== "loading" && (
        <span data-testid="stat-previous" className="mt-1 whitespace-nowrap text-sm font-semibold text-neutral-500/80">
          <span className="font-normal">vs </span>
          {compare.previous}
        </span>
      )}
    </>
  );

  return (
    <Panel>
      <CardHeader className="p-4">
        <CardTitle className="text-base text-neutral-300 md:text-lg">
          {onSelect ? (
            <button
              type="button"
              aria-pressed={selected}
              onClick={onSelect}
              className={cn(
                "group flex w-full flex-col items-start gap-1 rounded-md p-2 text-left transition-colors duration-150",
                "hover:bg-navy-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-navy-800/70"
              )}
            >
              {content}
            </button>
          ) : (
            <span className="flex flex-col items-start gap-1 p-2">{content}</span>
          )}
        </CardTitle>
      </CardHeader>
    </Panel>
  );
}
