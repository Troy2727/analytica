"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPeriodData, type PeriodData } from "@/lib/queries";
import { comparisonWindows, type ComparisonWindows } from "@/lib/timeframe";

export type ComparisonStatus = "idle" | "loading" | "ready" | "error";

export interface Comparison {
  available: boolean; // false for Lifetime
  enabled: boolean; // the stored preference
  onToggle: () => void;
  status: ComparisonStatus;
  previous: PeriodData | null;
  windows: ComparisonWindows | null;
  onRetry: () => void;
}

const storageKey = (domain: string) => `compare-period:${domain}`;

/**
 * "Compare with previous period" for one site: the on/off preference (kept in
 * localStorage per site) and the previous window's data for the current timeframe.
 */
export default function useComparison(domain: string, timeframe: string, asOf: number | undefined): Comparison {
  const [enabled, setEnabled] = useState(false);
  const [result, setResult] = useState<{ key: string; status: ComparisonStatus; previous: PeriodData | null }>({
    key: "",
    status: "idle",
    previous: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(storageKey(domain)) === "1");
    } catch {
      // storage blocked: the preference lasts for this page only
    }
  }, [domain]);

  const available = comparisonWindows(timeframe, 0) !== null;
  const windows = useMemo(() => (asOf === undefined ? null : comparisonWindows(timeframe, asOf)), [timeframe, asOf]);
  const active = enabled && windows !== null;
  // Identifies one request; results for any other key are stale.
  const key = active ? `${windows.previousStart}|${windows.previousEnd}|${attempt}` : "";
  const start = windows?.previousStart;
  const end = windows?.previousEnd;

  useEffect(() => {
    if (!key || start === undefined || end === undefined) return;
    let current = true;
    getPeriodData(domain, start, end).then(
      (previous) => current && setResult({ key, status: "ready", previous }),
      (error) => {
        console.error("Loading the previous period failed:", error);
        if (current) setResult({ key, status: "error", previous: null });
      }
    );
    return () => {
      current = false;
    };
  }, [domain, key, start, end]);

  const onToggle = useCallback(() => {
    if (!available) return;
    const next = !enabled;
    try {
      if (next) localStorage.setItem(storageKey(domain), "1");
      else localStorage.removeItem(storageKey(domain));
    } catch {
      // storage blocked: keep the in-memory state
    }
    setEnabled(next);
  }, [available, domain, enabled]);

  const settled = key !== "" && result.key === key;
  return {
    available,
    enabled,
    onToggle,
    status: !key ? "idle" : settled ? result.status : "loading",
    previous: settled ? result.previous : null,
    windows: active ? windows : null,
    onRetry: () => setAttempt((n) => n + 1),
  };
}
