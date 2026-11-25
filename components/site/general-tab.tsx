"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowBigUpDash,
  BarChart2,
  Clock,
  CornerUpLeft,
  Download,
  ExternalLink,
  Globe,
  MapPin,
  Monitor,
  MousePointerClick,
  Smartphone,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Panel } from "@/components/site/panel";
import { browserIcon, deviceIcon, osIcon } from "@/components/site/platform-icons";
import { RankedList, type RankedRow } from "@/components/site/ranked-list";
import { StatTile } from "@/components/site/stat-tile";
import { ChangeBadge } from "@/components/site/change-badge";
import { CompareToggle } from "@/components/site/compare-toggle";
import { FilterBar } from "@/components/site/filter-bar";
import TrafficChart, { type ChartComparison, type Series } from "@/components/site/traffic-chart";
import type { Comparison } from "@/hooks/useComparison";
import useUrlFilters from "@/hooks/useUrlFilters";
import {
  buildSessions,
  METRICS,
  pageSessionStats,
  pagesPerSession,
  pagesPerSessionValue,
  sessionMetrics,
  topBrowsers,
  topCities,
  topCountries,
  topDevices,
  topLinks,
  topOperatingSystems,
  topPages,
  topSources,
} from "@/lib/analytics";
import { flagUrl } from "@/lib/countries";
import { type ChangeKind, changeOf } from "@/lib/compare";
import {
  applyFilters,
  DIMENSION_LABELS,
  type Dimension,
  filterValueLabel,
  inSessionsOf,
  removeFilter,
  setFilter,
} from "@/lib/filters";
import { capitalize, compactNumber, formatDuration, formatPercent } from "@/lib/format";
import { getActiveUsers } from "@/lib/queries";
import { withinTimeframe } from "@/lib/timeframe";
import type { Engagement, LinkEvent, PageView, Tally, Visit } from "@/types";

const ACTIVE_USERS_REFRESH_MS = 60_000;

function Flag({ country }: { country: string }) {
  return (
    <Image src={flagUrl(country)} alt={`${country} flag`} width={20} height={15} className="shadow-sm" loading="lazy" />
  );
}

/** Rows with an icon in front of the label. */
const withIcon = (tallies: Tally[], icon: (label: string) => React.ReactNode, show = (l: string) => l): RankedRow[] =>
  tallies.map(({ label, count }) => ({
    key: label,
    count,
    content: (
      <span className="flex items-center gap-2">
        {icon(label)}
        {show(label)}
      </span>
    ),
  }));

const isWebUrl = (url: string) => {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

/** A clicked link's URL, shown without its protocol; only http(s) URLs become links. */
function LinkLabel({ url }: { url: string }) {
  const text = (
    <>
      <ExternalLink aria-hidden className="h-3 w-3 shrink-0" />
      <span className="truncate">{url.replace(/^https?:\/\//i, "")}</span>
    </>
  );
  return isWebUrl(url) ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className="flex min-w-0 items-center gap-1.5 rounded-md text-blue-400 transition-colors duration-150 hover:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {text}
    </a>
  ) : (
    <span title={url} className="flex min-w-0 items-center gap-1.5">
      {text}
    </span>
  );
}

const linkRows = (rows: LinkEvent[], kind: LinkEvent["kind"]): RankedRow[] =>
  topLinks(rows, kind).map(({ label, count }) => ({ key: label, count, content: <LinkLabel url={label} /> }));

function NoLinks({ what }: { what: string }) {
  return (
    <>
      <p>No {what} recorded yet</p>
      <p className="mt-1 text-xs text-neutral-500">These are tracked automatically by the tracking script.</p>
    </>
  );
}

const PAGES_PER_SESSION = {
  changeKind: "relative" as ChangeKind,
  lowerIsBetter: false,
  format: (n: number | null) => (n === null ? "—" : n.toFixed(1)),
  value: pagesPerSessionValue,
};

/**
 * Traffic overview: headline numbers, the traffic chart, and the top-N breakdowns.
 * With `comparison` (owner view only) it also offers comparing with the previous period.
 */
export default function GeneralTab({
  domain,
  pageViews: allPageViews,
  visits: allVisits,
  engagement: allEngagement,
  timeframe,
  comparison,
  activeUsers: fixedActiveUsers,
  linkEvents: allLinkEvents,
}: {
  domain: string;
  pageViews: PageView[];
  visits: Visit[];
  engagement: Engagement[];
  /** Outbound link clicks and downloads; the cards are shown only when given (owner view). */
  linkEvents?: LinkEvent[];
  timeframe: string;
  comparison?: Comparison;
  /** A known count (shared view); without it the owner view polls for one. */
  activeUsers?: number;
}) {
  const [filters, setFilters] = useUrlFilters();
  // Filters narrow every number, chart and card to the matching sessions, in both periods.
  const { pageViews, visits } = useMemo(() => applyFilters(allPageViews, allVisits, filters), [allPageViews, allVisits, filters]);
  const engagement = filters.length ? inSessionsOf(allEngagement, pageViews) : allEngagement;
  const linkEvents = allLinkEvents && filters.length ? inSessionsOf(allLinkEvents, pageViews) : allLinkEvents;
  const unfilteredPrevious = comparison?.status === "ready" ? comparison.previous : null;
  const previous = useMemo(
    () => (unfilteredPrevious ? applyFilters(unfilteredPrevious.pageViews, unfilteredPrevious.visits, filters) : null),
    [unfilteredPrevious, filters]
  );
  const windows = comparison?.windows;
  const chartComparison: ChartComparison | null = useMemo(
    () => (previous && windows ? { previous, windowMs: windows.windowMs, asOf: windows.currentEnd } : null),
    [previous, windows]
  );
  const [activeUsers, setActiveUsers] = useState(0);
  const [countriesOnly, setCountriesOnly] = useState(false);
  const [series, setSeries] = useState<Series>("pageViews");

  useEffect(() => {
    if (fixedActiveUsers !== undefined) return;
    const refresh = () => getActiveUsers(domain).then(setActiveUsers);
    refresh();
    const timer = setInterval(refresh, ACTIVE_USERS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [domain, fixedActiveUsers]);

  if (withinTimeframe(allPageViews, timeframe).length === 0 && withinTimeframe(allVisits, timeframe).length === 0) {
    return (
      <>
        {comparison && <CompareToggle comparison={comparison} />}
        <Panel>
          <CardContent className="p-6 text-center text-neutral-100">
            No analytics available for the given time range.
          </CardContent>
        </Panel>
      </>
    );
  }

  const { bounceRate, visitDuration } = sessionMetrics(buildSessions(pageViews));
  const perPage = pageSessionStats(pageViews, engagement);
  const pageRows: RankedRow[] = topPages(pageViews).map(({ label, count }) => ({
    key: label,
    count,
    content: <span className="block max-w-[80%] truncate">/{label}</span>,
    details: [
      { label: "Bounce rate", value: formatPercent(perPage.get(label)?.bounceRate ?? null), suffix: "bounce" },
      { label: "Time on page", value: formatDuration(perPage.get(label)?.timeOnPage ?? null) },
    ],
  }));
  /** Rows that filter the dashboard by `dimension` when clicked. */
  const filterable = (dimension: Dimension, rows: RankedRow[]): RankedRow[] =>
    rows.map((row) => ({
      ...row,
      select: {
        label: `Filter by ${DIMENSION_LABELS[dimension]}: ${filterValueLabel({ dimension, value: row.key })}`,
        onSelect: () => setFilters(setFilter(filters, { dimension, value: row.key })),
      },
    }));
  // A source filter needs visits linked to page views by session id (shared links leave those out).
  const sourcesFilterable = allVisits.some((visit) => visit.client_session_id);
  const selectable = (key: Series) => ({ selected: series === key, onSelect: () => setSeries(key) });

  /** A tile's comparison: loading, or the change badge and previous value. */
  const compareTile = (metric: Pick<typeof PAGES_PER_SESSION, "changeKind" | "lowerIsBetter" | "format" | "value">) => {
    if (comparison?.status === "loading") return "loading" as const;
    if (!previous) return undefined;
    const before = metric.value(previous.pageViews, previous.visits);
    const change = changeOf(metric.changeKind, metric.value(pageViews, visits), before);
    return {
      badge: change === null ? null : <ChangeBadge change={change} kind={metric.changeKind} lowerIsBetter={metric.lowerIsBetter} />,
      previous: metric.format(before),
    };
  };

  const sourceRows: RankedRow[] = topSources(visits).map(({ label, count }) => ({ key: label, count, content: label }));

  const locationRows: RankedRow[] = countriesOnly
    ? topCountries(pageViews).map(({ label, count }) => ({
        key: label,
        count,
        content: (
          <span className="flex items-center gap-4">
            <Flag country={label} />
            <span className="font-medium">{label}</span>
          </span>
        ),
      }))
    : topCities(pageViews).map((place) => ({
        key: `${place.city}|${place.region}|${place.country}`,
        count: place.count,
        content: (
          <span className="flex items-center gap-4">
            <Flag country={place.country} />
            <span className="flex items-baseline gap-1.5">
              <span className="font-medium">{place.city}</span>
              <span className="truncate text-[11px] text-neutral-400">
                {place.region}, {place.country}
              </span>
            </span>
          </span>
        ),
      }));

  return (
    <>
      {comparison && <CompareToggle comparison={comparison} />}
      <FilterBar
        filters={filters}
        onRemove={(dimension) => setFilters(removeFilter(filters, dimension))}
        onClear={() => setFilters([])}
      />

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={Users} label="Total Visits" value={compactNumber(visits.length)} {...selectable("visits")} compare={compareTile(METRICS.visits)} />
        <StatTile
          icon={MousePointerClick}
          label="Page Views"
          value={compactNumber(pageViews.length)}
          {...selectable("pageViews")}
          compare={compareTile(METRICS.pageViews)}
        />
        <StatTile
          icon={CornerUpLeft}
          label="Bounce Rate"
          value={formatPercent(bounceRate)}
          {...selectable("bounceRate")}
          compare={compareTile(METRICS.bounceRate)}
        />
        <StatTile
          icon={Timer}
          label="Visit Duration"
          value={formatDuration(visitDuration)}
          {...selectable("visitDuration")}
          compare={compareTile(METRICS.visitDuration)}
        />
        <StatTile icon={Activity} label="Pages/Session" value={pagesPerSession(pageViews, visits)} compare={compareTile(PAGES_PER_SESSION)} />
        <StatTile icon={Clock} label="Active Users (~10 mins)" value={fixedActiveUsers ?? activeUsers} />
      </div>

      <div className="my-6">
        <TrafficChart
          pageViews={pageViews}
          visits={visits}
          timeframe={timeframe}
          series={series}
          onSeriesChange={setSeries}
          comparison={chartComparison}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankedList title="Top Pages" icon={BarChart2} rows={filterable("page", pageRows)} />
        <RankedList
          title="Top Visit Sources"
          icon={ArrowBigUpDash}
          rows={sourcesFilterable ? filterable("source", sourceRows) : sourceRows}
        />
        <RankedList
          title="Visitor Locations"
          icon={MapPin}
          rows={filterable(countriesOnly ? "country" : "city", locationRows)}
          action={
            <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setCountriesOnly(!countriesOnly)}>
              {countriesOnly ? "Show All Info" : "Show Countries Only"}
            </Button>
          }
        />
        <RankedList title="Operating Systems" icon={Monitor} rows={filterable("os", withIcon(topOperatingSystems(pageViews), osIcon))} />
        <RankedList title="Device Types" icon={Smartphone} rows={filterable("device", withIcon(topDevices(pageViews), deviceIcon, capitalize))} />
        <RankedList title="Browsers" icon={Globe} rows={filterable("browser", withIcon(topBrowsers(pageViews), browserIcon))} />
        {linkEvents && (
          <>
            <RankedList
              title="Top Outbound Links"
              icon={ExternalLink}
              rows={linkRows(linkEvents, "outbound")}
              header={{ label: "URL", count: "Clicks" }}
              empty={<NoLinks what="outbound link clicks" />}
            />
            <RankedList
              title="Top File Downloads"
              icon={Download}
              rows={linkRows(linkEvents, "download")}
              header={{ label: "URL", count: "Downloads" }}
              empty={<NoLinks what="file downloads" />}
            />
          </>
        )}
      </div>
    </>
  );
}
