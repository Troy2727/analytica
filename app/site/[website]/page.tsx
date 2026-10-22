"use client";

import { ArrowUpRightIcon, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Loading from "@/components/loading";
import DaySummary from "@/components/site/day-summary";
import EventsTab from "@/components/site/events-tab";
import GeneralTab from "@/components/site/general-tab";
import PerformanceTab from "@/components/site/performance-tab";
import SettingsTab from "@/components/site/settings-tab";
import WaitingForData from "@/components/site/waiting-for-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useUser from "@/hooks/useUser";
import { getSiteData, type SiteData } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { TIMEFRAMES, withinTimeframe } from "@/lib/timeframe";

const TABS = [
  { value: "general", label: "General" },
  { value: "performance", label: "Performance" },
  { value: "custom-events", label: "Events" },
  { value: "settings", label: "Settings" },
];

const glassControl = "border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80";

/** Analytics for one of the user's websites. Other users' domains bounce to the dashboard. */
export default function SitePage() {
  const domain = String(useParams().website);
  const router = useRouter();
  const { user } = useUser({ required: true });

  const [owned, setOwned] = useState<boolean | null>(null);
  const [timeframe, setTimeframe] = useState("0");
  const [data, setData] = useState<SiteData | null>(null);
  const [showDaySummary, setShowDaySummary] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("websites")
      .select("id")
      .eq("name", domain)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: site, error }) => {
        setOwned(Boolean(site) && !error);
        if (!site || error) router.push("/dashboard");
      });
  }, [user, domain, router]);

  const load = useCallback(
    async (range: string) => {
      setData(null);
      try {
        setData(await getSiteData(domain, range));
        setTimeframe(range);
      } catch (error) {
        console.error("Loading site analytics failed:", error);
        setData({ pageViews: [], visits: [], events: [] });
      }
    },
    [domain]
  );

  useEffect(() => {
    if (owned) load("0");
  }, [owned, load]);

  if (!owned || !data) return owned === false ? null : <Loading text="Getting your data..." />;
  // Only a site with no traffic ever gets the install screen; an empty shorter
  // timeframe shows the General tab's "no analytics" message instead.
  if (data.pageViews.length === 0 && timeframe === "0") return <WaitingForData domain={domain} />;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {showDaySummary && (
          <DaySummary
            visits={{ recent: withinTimeframe(data.visits, "last 1 day").length, total: data.visits.length }}
            pageViews={{ recent: withinTimeframe(data.pageViews, "last 1 day").length, total: data.pageViews.length }}
            onClose={() => setShowDaySummary(false)}
          />
        )}

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex text-xl font-bold tracking-tight text-white md:text-2xl">
              Analytics for {domain}
              <Link href={`https://${domain}`} target="_blank" aria-label={`Open ${domain}`}>
                <ArrowUpRightIcon className="h-6 w-6 md:-mt-1 md:h-9 md:w-9" />
              </Link>
            </h1>
            <p className="text-sm text-neutral-100">Track your website performance and user engagement</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={load}>
              <SelectTrigger className={`w-[180px] ${glassControl}`}>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="border-navy-800 bg-navy-900 text-neutral-100">
                {TIMEFRAMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => load(timeframe)} variant="outline" size="icon" className={`${glassControl} hover:text-white`}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh analytics</span>
            </Button>
          </div>
        </header>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-2 w-full border border-navy-900 bg-navy-900/30 p-1 backdrop-blur-sm">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="w-1/4 data-[state=active]:bg-navy-800 data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="general">
            <GeneralTab domain={domain} pageViews={data.pageViews} visits={data.visits} timeframe={timeframe} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab domain={domain} />
          </TabsContent>
          <TabsContent value="custom-events">
            <EventsTab events={data.events} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab domain={domain} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
