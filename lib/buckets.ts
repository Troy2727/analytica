// Hourly or daily buckets for the traffic chart, optionally paired with the
// previous period's buckets.

import { buildSessions, type Session, sessionMetrics } from "@/lib/analytics";
import type { PageView, Visit } from "@/types";

export interface BucketValues {
  pageViews: number;
  visits: number;
  bounceRate: number | null; // null when no session started in the bucket
  visitDuration: number | null;
}

export interface Bucket extends BucketValues {
  start: number; // ms timestamp of the hour or day the bucket covers
}

/** A bucket with its counterpart from the previous period, flattened for the chart. */
export type ComparedBucket = Bucket & { [K in keyof BucketValues as `prev_${K}`]: BucketValues[K] };

const EMPTY: BucketValues = { pageViews: 0, visits: 0, bounceRate: null, visitDuration: null };

/** Start of the hour (or day) containing `iso`, in local time. */
export function bucketStart(iso: string, hourly: boolean): number {
  const date = new Date(iso);
  date.setMinutes(0, 0, 0);
  if (!hourly) date.setHours(0);
  return date.getTime();
}

export function buildBuckets(views: PageView[], visits: Visit[], hourly: boolean): Bucket[] {
  const buckets = new Map<number, Bucket>();
  const bucketAt = (iso: string) => {
    const start = bucketStart(iso, hourly);
    const bucket = buckets.get(start) ?? { start, ...EMPTY };
    buckets.set(start, bucket);
    return bucket;
  };
  views.forEach((v) => (bucketAt(v.created_at).pageViews += 1));
  visits.forEach((v) => (bucketAt(v.created_at).visits += 1));

  // A session belongs to the bucket of its first page view.
  const sessionsByBucket = new Map<number, Session[]>();
  for (const session of buildSessions(views)) {
    const start = bucketStart(session[0].created_at, hourly);
    const list = sessionsByBucket.get(start) ?? [];
    list.push(session);
    sessionsByBucket.set(start, list);
  }
  for (const [start, sessions] of sessionsByBucket) {
    Object.assign(buckets.get(start)!, sessionMetrics(sessions));
  }
  return [...buckets.values()].sort((a, b) => a.start - b.start);
}

/**
 * A moment inside the previous-period bucket that pairs with `start`, for its label.
 * Daily buckets are read at midday so a daylight-saving change can't move the date.
 */
export function previousBucketMoment(start: number, windowMs: number, hourly: boolean): number {
  return start - windowMs + (hourly ? 0 : 12 * 60 * 60 * 1000);
}

/** The same rows moved `ms` later, so a previous period lines up with the current one. */
export function shiftRows<T extends { created_at: string }>(rows: T[], ms: number): T[] {
  return rows.map((row) => ({ ...row, created_at: new Date(new Date(row.created_at).getTime() + ms).toISOString() }));
}

/**
 * Pair current buckets with previous-period buckets (already shifted forward by
 * the window length) by start time. A side with no rows counts 0 and has no
 * session values.
 */
export function mergeBuckets(current: Bucket[], previous: Bucket[]): ComparedBucket[] {
  const byStart = new Map<number, ComparedBucket>();
  const at = (start: number) => {
    const bucket =
      byStart.get(start) ??
      ({ start, ...EMPTY, prev_pageViews: 0, prev_visits: 0, prev_bounceRate: null, prev_visitDuration: null } as ComparedBucket);
    byStart.set(start, bucket);
    return bucket;
  };
  for (const { start, ...values } of current) Object.assign(at(start), values);
  for (const { start, ...values } of previous) {
    Object.assign(at(start), {
      prev_pageViews: values.pageViews,
      prev_visits: values.visits,
      prev_bounceRate: values.bounceRate,
      prev_visitDuration: values.visitDuration,
    });
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}
