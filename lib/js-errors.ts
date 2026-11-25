// JavaScript errors reported by the tracking script: validating what /api/track
// stores, and grouping rows for the Errors tab.

import type { JsError } from "@/types";

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : null);
const position = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1e9 ? value : null;

/** The columns to store for a `js_error` event, or null when it carries no message. */
export function parseJsError(body: {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  file?: unknown;
  line?: unknown;
  col?: unknown;
}) {
  const message = text(body.message, 1000);
  if (message === null) return null;
  return {
    name: text(body.name, 100)?.trim() || "Error",
    message,
    stack: text(body.stack, 8000) || null,
    file: text(body.file, 2048) || null,
    line: position(body.line),
    col: position(body.col),
  };
}

export interface ErrorGroup {
  key: string;
  name: string;
  message: string;
  occurrences: JsError[]; // newest first
  sessions: number;
  lastSeen: string;
}

/** Errors with the same name and message, most frequent first (ties: most recent first). */
export function groupErrors(rows: JsError[]): ErrorGroup[] {
  const groups = new Map<string, JsError[]>();
  for (const row of rows) {
    const key = `${row.name}\u0000${row.message}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const occurrences = [...list].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      return {
        key,
        name: occurrences[0].name,
        message: occurrences[0].message,
        occurrences,
        sessions: new Set(occurrences.map((row) => row.client_session_id).filter(Boolean)).size,
        lastSeen: occurrences[0].created_at,
      };
    })
    .sort((a, b) => b.occurrences.length - a.occurrences.length || Date.parse(b.lastSeen) - Date.parse(a.lastSeen));
}

/** Occurrences counted in `bars` equal slices of [start, end]; rows outside are ignored. */
export function sparkline(rows: JsError[], start: number, end: number, bars: number): number[] {
  const counts = new Array<number>(bars).fill(0);
  const span = Math.max(end - start, 1);
  for (const row of rows) {
    const at = Date.parse(row.created_at);
    if (at < start || at > end) continue;
    counts[Math.min(Math.floor(((at - start) / span) * bars), bars - 1)]++;
  }
  return counts;
}

const FRAME = /((?:https?|file):\/\/[^\s()]+?):(\d+):(\d+)/;

/** Where the error was thrown, "url:line:col": the first frame of the stack, else the reported file. */
export function errorLocation(row: Pick<JsError, "stack" | "file" | "line" | "col">): string | null {
  const frame = row.stack?.match(FRAME);
  if (frame) return `${frame[1]}:${frame[2]}:${frame[3]}`;
  if (!row.file) return null;
  return [row.file, row.line, row.col].filter((part) => part !== null).join(":");
}
