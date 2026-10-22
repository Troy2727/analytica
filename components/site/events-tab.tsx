"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocsLink } from "@/components/site/panel";
import { countByEventName } from "@/lib/analytics";
import { longDate } from "@/lib/format";
import type { CustomEvent } from "@/types";

const section = "border-navy-800 bg-gradient-to-br from-blue-900/20 to-black shadow-lg";
const navButton = "static bg-navy-800 text-neutral-100 hover:bg-navy-700 hover:text-neutral-100";

/** Custom events: a count per event name (click one to filter) and the event log. */
export default function EventsTab({ events }: { events: CustomEvent[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const counts = useMemo(() => Object.entries(countByEventName(events)), [events]);
  const shown = useMemo(
    () =>
      events
        .filter((e) => !selected || e.event_name === selected)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [events, selected]
  );

  if (counts.length === 0) {
    return (
      <Card className={section}>
        <CardContent className="p-12 text-center">
          <p className="text-lg font-semibold text-neutral-100">No custom events recorded yet</p>
          <p className="mt-2 text-neutral-400">
            Custom events will appear here once they are tracked. Learn how to send them in the <DocsLink />.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={`${section} overflow-hidden`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-neutral-100">Custom Events Overview</CardTitle>
          <p className="text-sm text-neutral-400">
            Learn more in our <DocsLink />
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-1">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {counts.map(([name, count]) => (
                <CarouselItem key={name} className="md:basis-1/2 lg:basis-1/3">
                  <button
                    type="button"
                    onClick={() => setSelected(name)}
                    className={`w-full rounded-lg border border-navy-800 bg-navy-900 p-6 text-left transition-colors duration-300 hover:bg-navy-700 ${
                      selected === name ? "shadow-lg ring-2 ring-neutral-400" : ""
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold text-neutral-200 md:text-base">{name}</span>
                    <span className="mt-4 block text-2xl font-bold tracking-tight text-neutral-100 md:text-3xl lg:text-4xl">
                      {count}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-400">Total Events</span>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-8 flex justify-end gap-2 p-1">
              <CarouselPrevious className={navButton} />
              <CarouselNext className={navButton} />
            </div>
          </Carousel>
        </CardContent>
      </Card>

      <Card className={section}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-neutral-100">Event Details</CardTitle>
          {selected && (
            <Button
              onClick={() => setSelected(null)}
              variant="outline"
              size="sm"
              className="border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700 hover:text-neutral-50"
            >
              Show All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <ul className="space-y-4">
              {shown.map((event) => (
                <li key={event.id} className="rounded-lg border border-navy-800 bg-navy-900 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <Badge variant="outline" className="border-emerald-500 bg-emerald-900 text-emerald-100">
                      {event.event_name}
                    </Badge>
                    <time className="text-xs text-neutral-400" dateTime={event.created_at}>
                      {longDate(event.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-neutral-300">{event.message}</p>
                  {event.fields && event.fields.length > 0 && (
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-navy-800 pt-3">
                      {event.fields.map((field, i) => (
                        <div key={i} className="space-y-1">
                          <dt className="text-xs font-medium text-neutral-400">{field.name}</dt>
                          <dd className="text-sm text-neutral-200">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
