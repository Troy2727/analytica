"use client";

import { ArrowUpRightIcon, Eye, Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NotFound from "@/app/not-found";
import Loading from "@/components/loading";
import GeneralTab from "@/components/site/general-tab";
import { Panel } from "@/components/site/panel";
import PerformanceTab from "@/components/site/performance-tab";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIMEFRAMES } from "@/lib/timeframe";
import type { Engagement, PageView, SharedPayload, Visit } from "@/types";

const glassControl = "border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80";

type State = { status: "loading" } | { status: "ready"; payload: SharedPayload } | { status: "error" } | { status: "gone" };

/** Give shared rows the shape the owner components expect; the ids are local placeholders. */
function toSiteRows(payload: SharedPayload) {
  const pageViews: PageView[] = payload.pageViews.map((v, i) => ({ ...v, id: String(i), domain: payload.domain }));
  const visits: Visit[] = payload.visits.map((v, i) => ({ ...v, session_id: String(i), event: "session_start" }));
  const engagement: Engagement[] = payload.engagement.map((e, i) => ({ ...e, id: String(i), domain: payload.domain }));
  return { pageViews, visits, engagement };
}

/** A website's read-only dashboard for share-link visitors: General and Performance only. */
export default function SharedDashboard({ domain, token }: { domain: string; token: string }) {
  const [timeframe, setTimeframe] = useState("0");
  const [state, setState] = useState<State>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);

  const load = useCallback(
    async (range: string) => {
      const request = ++latest.current;
      setBusy(true);
      setState((s) => (s.status === "ready" ? s : { status: "loading" }));
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(domain)}/${token}?timeframe=${encodeURIComponent(range)}`, {
          cache: "no-store",
        });
        if (request !== latest.current) return;
        if (res.status === 404) return setState({ status: "gone" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as SharedPayload;
        if (request !== latest.current) return;
        setTimeframe(range);
        setState({ status: "ready", payload });
      } catch (error) {
        console.error("Loading shared analytics failed:", error);
        if (request === latest.current) setState({ status: "error" });
      } finally {
        if (request === latest.current) setBusy(false);
      }
    },
    [domain, token]
  );

  useEffect(() => {
    load("0");
  }, [load]);

  const rows = useMemo(() => (state.status === "ready" ? toSiteRows(state.payload) : null), [state]);

  if (state.status === "gone") return <NotFound />;
  if (state.status === "loading" && !rows) return <Loading text="Getting the analytics..." />;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-white md:text-2xl">
              <span className="flex">
                Analytics for {domain}
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${domain}`}>
                  <ArrowUpRightIcon className="h-6 w-6 md:-mt-1 md:h-9 md:w-9" />
                </a>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-navy-800 bg-navy-900/40 px-2 py-0.5 text-xs font-normal text-neutral-300">
                <Eye className="h-3 w-3" />
                Read-only shared view
              </span>
            </h1>
            <p className="text-sm text-neutral-100">Shared read-only analytics</p>
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
            <Button
              onClick={() => load(timeframe)}
              disabled={busy}
              variant="outline"
              size="icon"
              className={`${glassControl} hover:text-white`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              <span className="sr-only">Refresh analytics</span>
            </Button>
          </div>
        </header>

        {state.status === "error" ? (
          <Panel>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center text-neutral-100">
              Could not load these analytics.
              <Button onClick={() => load(timeframe)} variant="outline" className={glassControl}>
                Retry
              </Button>
            </CardContent>
          </Panel>
        ) : rows && state.status === "ready" && rows.pageViews.length === 0 && timeframe === "0" ? (
          <Panel>
            <CardContent className="p-6 text-center text-neutral-100">No analytics yet.</CardContent>
          </Panel>
        ) : (
          rows &&
          state.status === "ready" && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-2 w-full border border-navy-900 bg-navy-900/30 p-1 backdrop-blur-sm">
                {["General", "Performance"].map((label) => (
                  <TabsTrigger
                    key={label}
                    value={label.toLowerCase()}
                    className="w-1/2 data-[state=active]:bg-navy-800 data-[state=active]:text-white"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="general">
                <GeneralTab
                  domain={domain}
                  pageViews={rows.pageViews}
                  visits={rows.visits}
                  engagement={rows.engagement}
                  timeframe={timeframe}
                  activeUsers={state.payload.activeUsers}
                />
              </TabsContent>
              <TabsContent value="performance">
                <PerformanceTab domain={domain} readOnly metrics={state.payload.metrics} />
              </TabsContent>
            </Tabs>
          )
        )}
      </div>
    </div>
  );
}
