"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowBigUpDash,
  BarChart2,
  Clock,
  Globe,
  MapPin,
  Monitor,
  MousePointerClick,
  Smartphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Panel } from "@/components/site/panel";
import { browserIcon, deviceIcon, osIcon } from "@/components/site/platform-icons";
import { RankedList, type RankedRow } from "@/components/site/ranked-list";
import { StatTile } from "@/components/site/stat-tile";
import TrafficChart from "@/components/site/traffic-chart";
import {
  pagesPerSession,
  topBrowsers,
  topCities,
  topCountries,
  topDevices,
  topOperatingSystems,
  topPages,
  topSources,
} from "@/lib/analytics";
import { flagUrl } from "@/lib/countries";
import { capitalize, compactNumber } from "@/lib/format";
import { getActiveUsers } from "@/lib/queries";
import { withinTimeframe } from "@/lib/timeframe";
import type { PageView, Tally, Visit } from "@/types";

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

/** Traffic overview: headline numbers, the traffic chart, and the top-N breakdowns. */
export default function GeneralTab({
  domain,
  pageViews,
  visits,
  timeframe,
}: {
  domain: string;
  pageViews: PageView[];
  visits: Visit[];
  timeframe: string;
}) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [countriesOnly, setCountriesOnly] = useState(false);

  useEffect(() => {
    const refresh = () => getActiveUsers(domain).then(setActiveUsers);
    refresh();
    const timer = setInterval(refresh, ACTIVE_USERS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [domain]);

  if (withinTimeframe(pageViews, timeframe).length === 0 && withinTimeframe(visits, timeframe).length === 0) {
    return (
      <Panel>
        <CardContent className="p-6 text-center text-neutral-100">
          No analytics available for the given time range.
        </CardContent>
      </Panel>
    );
  }

  const pageRows: RankedRow[] = topPages(pageViews).map(({ label, count }) => ({
    key: label,
    count,
    content: <span className="block max-w-[80%] truncate">/{label}</span>,
  }));

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Total Visits" value={compactNumber(visits.length)} />
        <StatTile icon={MousePointerClick} label="Page Views" value={compactNumber(pageViews.length)} />
        <StatTile icon={Activity} label="Pages/Session" value={pagesPerSession(pageViews, visits)} />
        <StatTile icon={Clock} label="Active Users (~10 mins)" value={activeUsers} />
      </div>

      <div className="my-6">
        <TrafficChart pageViews={pageViews} visits={visits} timeframe={timeframe} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankedList title="Top Pages" icon={BarChart2} rows={pageRows} />
        <RankedList title="Top Visit Sources" icon={ArrowBigUpDash} rows={sourceRows} />
        <RankedList
          title="Visitor Locations"
          icon={MapPin}
          rows={locationRows}
          action={
            <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setCountriesOnly(!countriesOnly)}>
              {countriesOnly ? "Show All Info" : "Show Countries Only"}
            </Button>
          }
        />
        <RankedList title="Operating Systems" icon={Monitor} rows={withIcon(topOperatingSystems(pageViews), osIcon)} />
        <RankedList title="Device Types" icon={Smartphone} rows={withIcon(topDevices(pageViews), deviceIcon, capitalize)} />
        <RankedList title="Browsers" icon={Globe} rows={withIcon(topBrowsers(pageViews), browserIcon)} />
      </div>
    </>
  );
}
