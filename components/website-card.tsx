import { ArrowBigUpDash, BarChart2, Globe, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WebsiteSummary } from "@/lib/queries";

/** All-time total, with how much of it arrived in the last 24 hours. */
function Counter({ icon: Icon, label, total, lastDay }: { icon: LucideIcon; label: string; total: number; lastDay: number }) {
  const share = total ? (lastDay / total) * 100 : 0;
  const tone = share > 0 ? "text-emerald-400" : "text-neutral-400";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-2xl font-bold tracking-tight text-white">{total.toLocaleString()}</span>
      <span className="flex items-center text-xs font-medium text-neutral-400">
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </span>
      <span className={`flex items-center text-xs ${tone}`}>
        <ArrowBigUpDash className="mr-0.5 h-3 w-3" />+{lastDay.toLocaleString()} ({share > 0 ? "+" : ""}
        {share.toFixed(1)}%) in 24h
      </span>
    </div>
  );
}

/** Dashboard tile for one website; opens its analytics page. */
export function WebsiteCard({ site }: { site: WebsiteSummary }) {
  return (
    <Link href={`/site/${site.name}`} className="block">
      <Card className="group relative overflow-hidden border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black px-4 pb-2 ring-blue-400/40 transition-all duration-300 hover:ring">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="relative flex flex-row items-center justify-between">
          <CardTitle className="bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-base font-medium text-transparent">
            {site.name}
          </CardTitle>
          <Globe className="h-4 w-4 text-neutral-400 transition-transform duration-500 group-hover:rotate-12 group-hover:text-primary/80" />
        </CardHeader>
        <CardContent className="relative grid grid-cols-2 gap-4">
          <Counter icon={Users} label="Total Visitors" {...site.visits} />
          <Counter icon={BarChart2} label="Total Views" {...site.pageViews} />
        </CardContent>
      </Card>
    </Link>
  );
}
