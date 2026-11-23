import type { NextConfig } from "next";

// Share links carry a secret token: keep them out of search engines, shared
// caches and Referer headers.
const SHARE_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

const config: NextConfig = {
  // Country flags on the Visitor Locations card are loaded from flagcdn.com.
  images: { remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }] },
  async headers() {
    return [
      { source: "/share/:path*", headers: SHARE_HEADERS },
      { source: "/api/share/:path*", headers: SHARE_HEADERS },
    ];
  },
};

export default config;
