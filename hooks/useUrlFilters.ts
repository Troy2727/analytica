"use client";

import { useCallback, useEffect, useState } from "react";
import { type Filter, parseFilters, withFilters } from "@/lib/filters";

/**
 * The General tab's filters, kept in the page URL so a filtered view can be
 * bookmarked or shared and the back button undoes a filter.
 */
export default function useUrlFilters(): [Filter[], (next: Filter[]) => void] {
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    const read = () => setFilters(parseFilters(window.location.search));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const update = useCallback((next: Filter[]) => {
    const { pathname, search, hash } = window.location;
    window.history.pushState(null, "", `${pathname}${withFilters(search, next)}${hash}`);
    setFilters(next);
  }, []);

  return [filters, update];
}
