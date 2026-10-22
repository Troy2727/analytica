import type { LucideIcon } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Panel } from "@/components/site/panel";
import { compactNumber } from "@/lib/format";

export interface RankedRow {
  key: string;
  count: number;
  content: React.ReactNode;
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
}: {
  title: string;
  icon: LucideIcon;
  rows: RankedRow[];
  action?: React.ReactNode;
}) {
  const largest = Math.max(1, ...rows.map((row) => row.count));

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
        <ScrollArea className="h-[300px]">
          <ul className="space-y-2 px-4 pb-4">
            {rows.map((row) => (
              <li
                key={row.key}
                className="relative flex items-center justify-between rounded-md bg-gradient-to-br from-blue-900/30 to-black/50 px-3 py-2"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-md bg-navy-800/50"
                  style={{ width: `${(row.count / largest) * 100}%` }}
                />
                <span className="relative z-10 min-w-0 flex-1 text-sm text-neutral-100">{row.content}</span>
                <span className="relative z-10 pl-3 text-sm text-white">{compactNumber(row.count)}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-navy-950/50 to-transparent" />
      </CardContent>
    </Panel>
  );
}
