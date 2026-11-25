import { ListFilter, X } from "lucide-react";
import { DIMENSION_LABELS, type Dimension, type Filter, filterValueLabel } from "@/lib/filters";
import { cn } from "@/lib/utils";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The active General-tab filters as removable chips, plus "Clear all" when there are several. */
export function FilterBar({
  filters,
  onRemove,
  onClear,
}: {
  filters: Filter[];
  onRemove: (dimension: Dimension) => void;
  onClear: () => void;
}) {
  if (!filters.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters" role="region">
      <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
        <ListFilter aria-hidden className="size-4" strokeWidth={1.5} />
        Filtered by
      </span>
      {filters.map((filter) => {
        const name = DIMENSION_LABELS[filter.dimension];
        const value = filterValueLabel(filter);
        return (
          <div
            key={filter.dimension}
            role="group"
            aria-label={`${name} is ${value}`}
            className="inline-flex h-8 max-w-full items-center overflow-hidden rounded-md border border-navy-800 bg-gradient-to-br from-blue-900/40 to-navy-900/40 text-sm backdrop-blur-sm"
          >
            <span className="pl-2.5 text-neutral-400">{name}</span>
            <span className="px-1.5 text-xs text-neutral-500">is</span>
            <span title={value} className="max-w-[14rem] truncate pr-2 font-medium text-white">
              {value}
            </span>
            <button
              type="button"
              onClick={() => onRemove(filter.dimension)}
              aria-label={`Remove filter ${name} is ${value}`}
              className={cn(
                "flex h-full items-center border-l border-navy-800 px-2 text-neutral-400 transition-colors duration-150 hover:bg-navy-800 hover:text-white",
                focusRing
              )}
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </div>
        );
      })}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className={cn("rounded-md px-2 py-1 text-xs text-neutral-400 transition-colors duration-150 hover:text-white hover:underline", focusRing)}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
