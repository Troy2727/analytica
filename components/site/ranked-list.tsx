import { ListFilter, type LucideIcon } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Panel } from "@/components/site/panel";
import { compactNumber } from "@/lib/format";

export interface RankedRow {
  key: string;
  count: number;
  content: React.ReactNode;
  /** Extra per-row values, shown under the label on phones and as columns from `sm` up. */
  details?: { label: string; value: string; suffix?: string }[];
  /** Row buttons (edit, delete), shown on hover or focus from `sm` up and always on phones. */
  actions?: React.ReactNode;
  /** Makes the whole row a button, e.g. to filter the dashboard by this row. */
  select?: { label: string; onSelect: () => void };
}

/**
 * A scrollable "top N" card (top pages, sources, countries...). Each row gets a
 * bar behind it sized relative to the largest count.
 */
export function RankedList({
  title,
  icon: Icon,
  rows,
  action,
  header,
  empty,
}: {
  title: string;
  icon: LucideIcon;
  rows: RankedRow[];
  action?: React.ReactNode;
  /** Column names shown above the list, e.g. "URL" and "Clicks". */
  header?: { label: string; count: string };
  /** Shown instead of the list when there are no rows. */
  empty?: React.ReactNode;
}) {
  const largest = Math.max(1, ...rows.map((row) => row.count));
  const detailHeaders = rows[0]?.details?.map((d) => d.label);

  return (
    <Panel>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center justify-between text-base text-neutral-300 md:text-lg">
          <span className="flex items-center gap-4">
            {title}
            {action}
          </span>
          <Icon className="h-6 w-6" />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative p-0 pt-2">
        {(header || detailHeaders) && rows.length > 0 && (
          <div aria-hidden className={`${header ? "flex" : "hidden sm:flex"} px-7 pb-1 text-xs font-medium text-neutral-500`}>
            <span className="flex-1">{header?.label}</span>
            <span className={detailHeaders ? "w-16 text-right" : "pl-3 text-right"}>{header?.count}</span>
            {detailHeaders?.map((label) => (
              <span key={label} className="hidden w-16 text-right sm:block">
                {label.split(" ")[0]}
              </span>
            ))}
            {rows.some((row) => row.actions) && <span className="ml-2 w-[60px]" />}
            {rows.some((row) => row.select) && <span className="ml-2 w-3.5" />}
          </div>
        )}
        {rows.length === 0 && empty ? (
          <div className="px-6 pb-8 pt-6 text-center text-sm text-neutral-400">{empty}</div>
        ) : (
          // Radix lays the viewport's child out as a table, which grows to fit a long label; block keeps truncation working.
          <ScrollArea className="h-[300px] [&>[data-radix-scroll-area-viewport]>div]:!block">
            <ul className="space-y-2 px-4 pb-4">
              {rows.map((row) => (
                <li
                  key={row.key}
                  className={`group relative flex items-center justify-between rounded-md bg-gradient-to-br from-blue-900/30 to-black/50 px-3 py-2 ${
                    row.select
                      ? "transition-colors duration-150 hover:from-blue-800/40 hover:to-navy-900/60 hover:ring-1 hover:ring-blue-400/40"
                      : ""
                  }`}
                >
                  {row.select && (
                    <button
                      type="button"
                      onClick={row.select.onSelect}
                      aria-label={row.select.label}
                      title={row.select.label}
                      className="absolute inset-0 z-20 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-md bg-navy-800/50"
                    style={{ width: `${(row.count / largest) * 100}%` }}
                  />
                  <span className="relative z-10 min-w-0 flex-1 text-sm text-neutral-100">
                    {row.content}
                    {row.details && (
                      <span className="block text-xs text-neutral-400 sm:hidden">
                        {row.details.map((d) => (d.suffix ? `${d.value} ${d.suffix}` : d.value)).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span
                    title={row.count.toLocaleString("en-US")}
                    className={`relative z-10 pl-3 text-sm text-white ${row.details ? "w-16 text-right" : ""}`}
                  >
                    {compactNumber(row.count)}
                  </span>
                  {row.details?.map((d) => (
                    <span key={d.label} title={d.label} className="relative z-10 hidden w-16 text-right text-xs text-neutral-400 sm:block">
                      {d.value}
                    </span>
                  ))}
                  {row.actions && (
                    // Hidden until hover/focus only where hovering is possible; always visible on touch screens.
                    <span className="relative z-10 ml-2 flex gap-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                      {row.actions}
                    </span>
                  )}
                  {row.select && (
                    // Same visibility rule as the actions: on hover/focus where hovering is possible, always on touch screens.
                    <ListFilter
                      aria-hidden
                      className="relative z-10 ml-2 size-3.5 shrink-0 text-blue-300 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                    />
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-navy-950/50 to-transparent" />
      </CardContent>
    </Panel>
  );
}
