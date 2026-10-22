"use client";

import { BarChart2, TrendingUp, Users, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { compactNumber } from "@/lib/format";

function Share({ icon: Icon, recent, total }: { icon: LucideIcon; recent: number; total: number }) {
  const percent = total ? (recent * 100) / total : 0;
  const quiet = Math.floor(percent) === 0;
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-neutral-400" />
      <span className="text-sm font-medium">{recent.toLocaleString()}</span>
      <span className={`flex items-center text-sm font-medium ${quiet ? "text-neutral-400" : "text-emerald-500"}`}>
        <TrendingUp className="mr-0.5 h-4 w-4" />
        {compactNumber(percent)}%
      </span>
    </span>
  );
}

/** Dismissible banner: visits and page views in the last 24 hours, and their share of the total. */
export default function DaySummary({
  visits,
  pageViews,
  onClose,
}: {
  visits: { recent: number; total: number };
  pageViews: { recent: number; total: number };
  onClose: () => void;
}) {
  return (
    <Card className="mb-8 border-navy-800 bg-black/95 text-white backdrop-blur-sm">
      <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <p className="text-sm font-medium">Last 24-hour stats:</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Share icon={Users} {...visits} />
          <Share icon={BarChart2} {...pageViews} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 self-end rounded-full hover:bg-navy-800 hover:text-white sm:self-auto"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close 24-hour stats</span>
        </Button>
      </CardContent>
    </Card>
  );
}
