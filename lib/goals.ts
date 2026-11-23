// Goals and funnels over tracked sessions. Pure functions: sessions come from
// buildSessions, so page views without a session id never count.

import { pathOf, type Session } from "@/lib/analytics";

const MAX_PATTERN = 200;
const MAX_WILDCARDS = 10;
const PATH_CHARS = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@/]+$/;
const LEADING_ORIGIN = /^[a-z][a-z0-9+.-]*:\/\/[^/]*/i;

/**
 * A path as goals compare it: no scheme/host, query or fragment; one leading
 * slash; no repeated or trailing slashes; single wildcards; lower case.
 */
export function normalizePath(raw: string): string {
  // Only a pasted full URL loses its origin; "://" later in a path is part of the path.
  let path = raw.trim().replace(LEADING_ORIGIN, "");
  path = path.split(/[?#]/)[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.replace(/\*{2,}/g, "*").toLowerCase();
}

/** The normalized pattern, or null when it can't be a page path. */
export function validatePattern(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const pattern = normalizePath(trimmed);
  const wildcards = pattern.split("*").length - 1;
  return pattern.length <= MAX_PATTERN && wildcards <= MAX_WILDCARDS && PATH_CHARS.test(pattern) ? pattern : null;
}

// Decode before lower-casing, so "%41" and "a" compare equal.
const comparable = (text: string) => {
  try {
    return decodeURIComponent(text).toLowerCase();
  } catch {
    return text.toLowerCase();
  }
};

/** A path in the form patterns are compared against. */
const comparablePath = (path: string) => comparable(normalizePath(path));

/**
 * `*` matches any run of characters (slashes included); everything else is
 * literal, including an encoded `%2A`; the whole path must match. Matching is
 * plain substring search, so no pattern can make it slow.
 */
function globMatcher(pattern: string): (path: string) => boolean {
  const parts = normalizePath(pattern).split("*").map(comparable);
  const first = parts[0];
  const last = parts[parts.length - 1];
  return (path) => {
    if (parts.length === 1) return path === first;
    if (!path.startsWith(first) || !path.endsWith(last) || path.length < first.length + last.length) return false;
    let at = first.length;
    for (const part of parts.slice(1, -1)) {
      const found = path.indexOf(part, at);
      if (found === -1 || found + part.length > path.length - last.length) return false;
      at = found + part.length;
    }
    return true;
  };
}

/** Matches raw paths (normalizing them first). */
export const patternMatcher = (pattern: string) => {
  const matches = globMatcher(pattern);
  return (path: string) => matches(comparablePath(path));
};

export const matchesPattern = (pattern: string, path: string) => patternMatcher(pattern)(path);

/** Each session's page paths, normalized once for all goals and funnels. */
export type SessionPaths = string[][];

export const sessionPaths = (sessions: Session[]): SessionPaths =>
  sessions.map((session) => session.map((view) => comparablePath(`/${pathOf(view.page)}`)));

const percent = (part: number, whole: number) => (whole ? (part / whole) * 100 : null);

export interface GoalStats {
  uniques: number; // sessions with at least one matching page view
  total: number; // matching page views
  rate: number | null; // uniques / sessions, percent
}

export function goalStats(sessions: SessionPaths, pattern: string): GoalStats {
  const matches = globMatcher(pattern);
  let uniques = 0;
  let total = 0;
  for (const session of sessions) {
    const hits = session.filter(matches).length;
    total += hits;
    if (hits) uniques += 1;
  }
  return { uniques, total, rate: percent(uniques, sessions.length) };
}

export interface FunnelStep {
  pattern: string;
  visitors: number; // sessions that reached this step
  rateFromFirst: number | null;
  rateFromPrevious: number | null; // null for step 1
  droppedCount: number | null; // null for step 1
  droppedPercent: number | null;
}

export interface FunnelStats {
  steps: FunnelStep[];
  entryShare: number | null; // step 1 visitors / all sessions
  overall: number | null; // last step / first step
}

/**
 * Sequential funnel: each session walks its page views oldest first, and a view
 * matching the next step moves it on. One view advances at most one step;
 * other pages in between are fine.
 */
export function funnelStats(sessions: SessionPaths, steps: string[]): FunnelStats {
  const matchers = steps.map(globMatcher);
  const reached = steps.map(() => 0);
  for (const session of sessions) {
    let next = 0;
    for (const path of session) {
      if (next < matchers.length && matchers[next](path)) next += 1;
    }
    for (let k = 0; k < next; k++) reached[k] += 1;
  }

  const first = reached[0] ?? 0;
  return {
    steps: steps.map((pattern, k) => {
      const previous = k ? reached[k - 1] : null;
      return {
        pattern,
        visitors: reached[k],
        rateFromFirst: percent(reached[k], first),
        rateFromPrevious: previous === null ? null : percent(reached[k], previous),
        droppedCount: previous === null ? null : previous - reached[k],
        droppedPercent: previous === null ? null : percent(previous - reached[k], previous),
      };
    }),
    entryShare: percent(first, sessions.length),
    overall: percent(reached[reached.length - 1] ?? 0, first),
  };
}
