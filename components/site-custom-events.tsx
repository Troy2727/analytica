"use client"

import { CustomEvent } from "@/types"
import { formatTimeStamp } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"

interface SiteCustomEventsProps {
  customEvents: CustomEvent[]
  groupedCustomEvents: Record<string, number>
  activeCustomEventTab: string
  setActiveCustomEventTab: (tab: string) => void
}

export default function SiteCustomEvents({
  customEvents = [],
  groupedCustomEvents = {},
  activeCustomEventTab = "",
  setActiveCustomEventTab,
}: SiteCustomEventsProps) {
  if (!customEvents || !Array.isArray(customEvents)) {
    return null
  }

  if (!groupedCustomEvents || Object.keys(groupedCustomEvents).length === 0) {
    return (
      <Card className="border-navy-800 bg-gradient-to-br from-blue-900/20 to-black shadow-lg">
        <CardContent className="p-12 text-center">
          <p className="text-neutral-100 text-lg font-semibold">No custom events recorded yet</p>
          <p className="text-neutral-400 mt-2">
            Custom events will appear here once they are tracked. Learn how to implement custom events in our{" "}
            <a
              href="https://github.com/Troy2727/analytica#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              documentation
            </a>.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-navy-800 bg-gradient-to-br from-blue-900/20 to-black shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col pb-4">
          <CardTitle className="text-xl font-bold text-neutral-100">
            Custom Events Overview
          </CardTitle>
          <p className="text-sm text-neutral-400">
            Learn more in our{" "}
            <a
              href="https://github.com/Troy2727/analytica#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              documentation
            </a>
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-1">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {Object.entries(groupedCustomEvents).map(([eventName, count]) => (
                <CarouselItem key={eventName} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card
                      className={`cursor-pointer border-navy-800 bg-navy-900 transition-all duration-300 hover:bg-navy-700 ${
                        activeCustomEventTab === eventName
                          ? "ring-2 ring-neutral-400 shadow-lg"
                          : ""
                      }`}
                      onClick={() => setActiveCustomEventTab(eventName)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-neutral-200 text-sm md:text-base truncate">
                          {eventName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-100">
                          {count}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">Total Events</p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-end gap-2 p-1 mt-8">
              <CarouselPrevious className="static bg-navy-800 hover:bg-navy-700 text-neutral-100 hover:text-neutral-100" />
              <CarouselNext className="static bg-navy-800 hover:bg-navy-700 text-neutral-100 hover:text-neutral-100" />
            </div>
          </Carousel>
        </CardContent>
      </Card>

      <Card className="border-navy-800 bg-gradient-to-br from-blue-900/20 to-black shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-neutral-100">Event Details</CardTitle>
          {activeCustomEventTab && (
            <Button
              onClick={() => setActiveCustomEventTab("")}
              variant="outline"
              size="sm"
              className="border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700 hover:text-neutral-50 transition-all duration-200"
            >
              Show All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {customEvents
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .filter((event) =>
                activeCustomEventTab
                  ? event.event_name === activeCustomEventTab
                  : true
              )
              .map((event) => (
                <Card
                  key={event.id}
                  className="mb-4 border-navy-800 bg-navy-900 transition-all duration-200 hover:bg-neutral-750"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-emerald-900 text-emerald-100 border-emerald-500">
                        {event.event_name}
                      </Badge>
                      <p className="text-xs text-neutral-400">
                        {formatTimeStamp(event.created_at)}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-300 mt-2">{event.message}</p>
                    {event.fields && event.fields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-navy-800">
                        <div className="grid grid-cols-2 gap-2">
                          {event.fields.map((field, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="text-xs font-medium text-neutral-400">{field.name}</p>
                              <p className="text-sm text-neutral-200">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}