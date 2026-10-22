import type { LucideIcon } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/site/panel";

/** A headline number with an icon and label, e.g. "Page Views 1.2K". */
export function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base text-neutral-300 md:text-lg">
          <span className="flex items-center gap-2">
            <Icon className="h-6 w-6" />
            <span className="mt-2 text-sm text-neutral-500">{label}</span>
          </span>
          <span className="text-base font-bold tracking-tight text-white md:text-lg">{value}</span>
        </CardTitle>
      </CardHeader>
    </Panel>
  );
}
