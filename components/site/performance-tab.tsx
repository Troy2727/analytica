"use client";

import { ArrowDownIcon, ArrowUpIcon, Loader2, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { getSavedMetrics, runPageSpeed } from "@/actions/pagespeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatMetric,
  grade,
  overallScore,
  recommendations,
  SCORE_METRICS,
  TIMING_METRICS,
} from "@/lib/pagespeed";
import type { PerformanceMetrics } from "@/types";

const tile =
  "group relative rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black backdrop-blur-sm transition-all duration-300 hover:border-navy-700 hover:bg-navy-800/50";
const gradientNumber = "bg-gradient-to-br from-white to-neutral-400 bg-clip-text font-semibold text-transparent";

function HoverLine() {
  return (
    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-navy-700 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
  );
}

/** A 0-100 score drawn as a ring. */
function ScoreRing({ value, label }: { value: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <figure className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle r={radius} cx="50" cy="50" fill="none" strokeWidth="10" stroke="currentColor" className="text-neutral-700" />
          <circle
            r={radius}
            cx="50"
            cy="50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="currentColor"
            className="text-blue-500"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{value}</span>
      </div>
      <figcaption className="mt-2 text-sm font-medium text-neutral-300">{label}</figcaption>
    </figure>
  );
}

function OverallScore({ metrics }: { metrics: PerformanceMetrics }) {
  const score = overallScore(metrics);
  const g = grade(score);
  const Arrow = g.passing ? ArrowUpIcon : ArrowDownIcon;
  return (
    <div className={`${tile} h-full p-2 sm:p-4`}>
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-navy-800 bg-navy-900/90 p-4 text-center sm:p-6">
        <div className={`mb-4 rounded-full p-2 sm:mb-6 sm:p-3 ${g.badge}`}>
          <Arrow className={`h-6 w-6 sm:h-8 sm:w-8 ${g.text}`} />
        </div>
        <div className={`mb-2 text-4xl sm:mb-3 sm:text-6xl md:text-7xl ${gradientNumber}`}>{score}</div>
        <div className={`mb-3 text-xs font-semibold sm:mb-4 sm:text-sm md:text-base ${g.text}`}>{g.label}</div>
        <h3 className="mb-2 text-base font-semibold text-white sm:text-lg md:text-xl">Overall Score</h3>
        <p className="max-w-[280px] text-xs text-neutral-400 sm:text-sm md:text-base">
          {g.passing
            ? "Your website is performing well across all key metrics"
            : "There's room for improvement in your website's performance"}
        </p>
      </div>
      <HoverLine />
    </div>
  );
}

function Recommendations({ metrics }: { metrics: PerformanceMetrics }) {
  const items = recommendations(metrics);
  return (
    <div className={`${tile} h-full p-6`}>
      <h3 className="text-lg font-semibold text-white md:text-xl">Optimization Opportunities</h3>
      <p className="mb-6 text-sm text-neutral-400 md:text-base">Actionable recommendations to improve your site</p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <ArrowUpIcon className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-neutral-400">Great job! No immediate improvements needed.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-4 rounded-lg border border-navy-800 bg-navy-900/50 p-4 transition-all duration-300 hover:border-navy-700 hover:bg-navy-800/50"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-navy-800/50 text-2xl">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="truncate font-medium text-neutral-200">{item.title}</h4>
                  <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-sm text-yellow-400">{item.value}</span>
                </div>
                <p className="line-clamp-2 text-sm text-neutral-500">{item.advice}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <HoverLine />
    </div>
  );
}

/** Lighthouse scores for the site, saved from the last run; "Analyze" runs a fresh one. */
export default function PerformanceTab({ domain }: { domain: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSavedMetrics(domain)
      .then(setMetrics)
      .catch(() => setError("Could not load saved performance metrics."));
  }, [domain]);

  async function analyze() {
    setRunning(true);
    setError(null);
    const fresh = await runPageSpeed(domain, `https://${domain}`);
    if (fresh) setMetrics(fresh);
    else setError("PageSpeed analysis failed. Check that the site is reachable and try again.");
    setRunning(false);
  }

  const header = (
    <CardHeader className="flex flex-row items-center justify-between border-b border-navy-800">
      <div>
        <CardTitle className="text-xl font-bold text-white">Performance Metrics</CardTitle>
        <CardDescription className="text-neutral-400">Website performance analysis</CardDescription>
      </div>
      {metrics && (
        <Button
          onClick={analyze}
          disabled={running}
          variant="outline"
          size="icon"
          className="border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80 hover:text-white"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          <span className="sr-only">Run a new analysis</span>
        </Button>
      )}
    </CardHeader>
  );

  return (
    <Card className="border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black text-neutral-100">
      {header}
      {metrics ? (
        <CardContent className="p-6 py-10">
          <div className="mb-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {SCORE_METRICS.map(({ key, label }) => (
              <ScoreRing key={key} value={metrics[key]} label={label} />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TIMING_METRICS.map(({ key, label, unit }) => (
              <div key={key} className={`${tile} p-6`}>
                <p className="text-sm font-medium text-neutral-400">{label}</p>
                <p className={`text-3xl tracking-tight ${gradientNumber}`}>{formatMetric(metrics[key], unit)}</p>
                <HoverLine />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <OverallScore metrics={metrics} />
            <div className="lg:col-span-2">
              <Recommendations metrics={metrics} />
            </div>
          </div>
          {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
        </CardContent>
      ) : (
        <CardContent className="flex flex-col items-center space-y-4 py-8">
          <p className="text-lg text-neutral-300">No performance data available</p>
          <Button onClick={analyze} disabled={running} className="bg-blue-600 text-white hover:bg-blue-500">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Performance"
            )}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      )}
    </Card>
  );
}
