"use client";

import { Bug, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/site/panel";
import { browserIcon, deviceIcon, osIcon } from "@/components/site/platform-icons";
import { pathOf } from "@/lib/analytics";
import { compactNumber, longDate } from "@/lib/format";
import { errorLocation, type ErrorGroup, groupErrors, sparkline } from "@/lib/js-errors";
import { cn } from "@/lib/utils";
import type { JsError } from "@/types";

const PAGE_SIZE = 10;
const BARS = 24;
const OCCURRENCES_STEP = 5;

const iconButton =
  "inline-flex items-center gap-1.5 rounded-md border border-navy-800 bg-navy-900/40 px-2.5 py-1 text-xs text-neutral-300 transition-colors duration-150 hover:bg-navy-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

/** "just now", "5 min ago", "3 h ago", "2 d ago". */
function timeAgo(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return `${Math.floor(minutes / (24 * 60))} d ago`;
}

function Sparkline({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  return (
    <svg aria-hidden viewBox={`0 0 ${counts.length * 4} 24`} preserveAspectRatio="none" className="h-8 w-28 shrink-0">
      {counts.map((count, i) => {
        const height = count === 0 ? 1 : Math.max(3, (count / max) * 24);
        return (
          <rect
            key={i}
            x={i * 4}
            y={24 - height}
            width={3}
            height={height}
            rx={0.75}
            className={count === 0 ? "fill-navy-800" : "fill-red-400/80"}
          />
        );
      })}
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={iconButton}
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? <Check aria-hidden className="size-3.5 text-emerald-400" /> : <Copy aria-hidden className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Occurrence({ row, now }: { row: JsError; now: number }) {
  const location = errorLocation(row);
  const browser = row.browser_name || "Unknown";
  const os = row.operating_system || "Unknown";
  const device = row.device_type || "Unknown";
  return (
    <li className="space-y-3 rounded-lg border border-navy-800 bg-navy-900/40 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
        <time dateTime={row.created_at} title={`${longDate(row.created_at)} ${new Date(row.created_at).toLocaleTimeString()}`}>
          {timeAgo(row.created_at, now)}
        </time>
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden className="size-3.5 text-blue-400" />
          {row.country || "Unknown"}
        </span>
        <span className="inline-flex items-center gap-1.5" title={browser}>
          {browserIcon(browser)}
          {browser}
        </span>
        <span className="inline-flex items-center gap-1.5" title={os}>
          {osIcon(os)}
          {os}
        </span>
        <span className="inline-flex items-center gap-1.5 capitalize" title={device}>
          {deviceIcon(device)}
          {device}
        </span>
        <span className="min-w-0 truncate text-blue-300" title={row.page}>
          /{pathOf(row.page)}
        </span>
      </div>
      {row.stack || location ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-xs text-neutral-300" title={location ?? undefined}>
              <span className="text-neutral-500">at </span>
              {location ?? "unknown location"}
            </p>
            {row.stack && <CopyButton text={row.stack} />}
          </div>
          {row.stack && (
            <pre className="max-h-64 overflow-auto rounded-md border border-navy-800 bg-black/60 p-3 font-mono text-xs leading-relaxed text-neutral-300">
              {row.stack}
            </pre>
          )}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">No stack trace was reported.</p>
      )}
    </li>
  );
}

function ErrorCard({ group, counts, now }: { group: ErrorGroup; counts: number[]; now: number }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(OCCURRENCES_STEP);
  const occurrences = group.occurrences.length;
  const panelId = `error-${group.occurrences[0].id}`;
  return (
    <li className={cn("rounded-lg border transition-colors duration-150", open ? "border-blue-400/30 bg-navy-900/60" : "border-navy-800 bg-navy-900/30")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 rounded-lg p-4 text-left transition-colors duration-150 hover:bg-navy-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block truncate font-mono text-sm font-semibold text-red-400">{group.name}</span>
          <span className="block truncate text-sm text-neutral-200" title={group.message}>
            {group.message || "(no message)"}
          </span>
          <span className="block text-xs text-neutral-500">Last seen {timeAgo(group.lastSeen, now)}</span>
        </span>
        <span className="hidden md:block">
          <Sparkline counts={counts} />
        </span>
        <span className="w-20 shrink-0 text-right">
          <span className="block text-lg font-bold text-white">{compactNumber(occurrences)}</span>
          <span className="block text-xs text-neutral-400">{occurrences === 1 ? "occurrence" : "occurrences"}</span>
        </span>
        <span className="hidden w-16 shrink-0 text-right sm:block">
          <span className="block text-lg font-bold text-white">{compactNumber(group.sessions)}</span>
          <span className="block text-xs text-neutral-400">{group.sessions === 1 ? "session" : "sessions"}</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-neutral-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div id={panelId} className="space-y-3 border-t border-navy-800 p-4">
          <ul className="space-y-3">
            {group.occurrences.slice(0, shown).map((row) => (
              <Occurrence key={row.id} row={row} now={now} />
            ))}
          </ul>
          {shown < occurrences && (
            <button type="button" className={iconButton} onClick={() => setShown(shown + OCCURRENCES_STEP * 2)}>
              Show more ({occurrences - shown} left)
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * JavaScript errors from visitors' browsers, grouped by name and message: occurrences
 * over time, how many sessions hit each, and every occurrence with its stack trace.
 */
export default function ErrorsTab({ errors, asOf }: { errors: JsError[]; asOf: number }) {
  const [page, setPage] = useState(0);
  const groups = useMemo(() => groupErrors(errors), [errors]);
  const start = useMemo(() => Math.min(...errors.map((row) => Date.parse(row.created_at)), asOf), [errors, asOf]);
  const sessions = useMemo(() => new Set(errors.map((row) => row.client_session_id).filter(Boolean)).size, [errors]);

  const pages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = groups.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <Panel>
      <CardHeader className="border-b border-navy-800">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
          <Bug aria-hidden className="size-5 text-red-400" />
          JavaScript Errors
        </CardTitle>
        <CardDescription className="text-neutral-400">
          {errors.length > 0
            ? `${compactNumber(errors.length)} ${errors.length === 1 ? "error" : "errors"} · ${groups.length} distinct · ${compactNumber(sessions)} ${sessions === 1 ? "session" : "sessions"} affected`
            : "Uncaught errors and unhandled promise rejections in your visitors' browsers"}
        </CardDescription>
      </CardHeader>

      {errors.length === 0 ? (
        <CardContent className="py-10 text-center">
          <p className="text-neutral-300">No JavaScript errors recorded</p>
          <p className="mt-1 text-sm text-neutral-500">
            The tracking script reports them automatically. Turn it off with{" "}
            <code className="rounded bg-navy-900 px-1 font-mono text-neutral-300">data-errors=&quot;false&quot;</code>.
          </p>
        </CardContent>
      ) : (
        <CardContent className="space-y-4 p-4 sm:p-6">
          <ul className="space-y-3">
            {visible.map((group) => (
              <ErrorCard key={group.key} group={group} counts={sparkline(group.occurrences, start, asOf, BARS)} now={asOf} />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-400">
            <p>
              Showing {current * PAGE_SIZE + 1} to {current * PAGE_SIZE + visible.length} of {groups.length} errors
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" className={iconButton} disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <ChevronLeft aria-hidden className="size-3.5" />
                  Previous
                </button>
                <span className="text-xs">
                  Page {current + 1} of {pages}
                </span>
                <button type="button" className={iconButton} disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
                  Next
                  <ChevronRight aria-hidden className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Panel>
  );
}
