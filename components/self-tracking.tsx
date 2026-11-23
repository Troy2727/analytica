"use client";

import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const SITE_URL = "https://analytica-phi.vercel.app";

/**
 * Analytica tracks its own site with the same script customers install, plus
 * Vercel Analytics. Neither runs on share links, whose URLs carry a secret token.
 */
export default function SelfTracking() {
  const pathname = usePathname();
  // A bad share token renders not-found, where usePathname() no longer reports
  // the /share/ URL, so the browser's own location is checked too.
  const browserPath = typeof window === "undefined" ? "" : window.location.pathname;
  if (pathname.startsWith("/share/") || browserPath.startsWith("/share/")) return null;
  return (
    <>
      <Analytics beforeSend={(event) => (event.url.includes("/share/") ? null : event)} />
      <Script defer data-domain="analytica-phi.vercel.app" src={`${SITE_URL}/tracking-script.js`} />
    </>
  );
}
