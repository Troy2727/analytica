import type { NextConfig } from "next";

const config: NextConfig = {
  // Country flags on the Visitor Locations card are loaded from flagcdn.com.
  images: { remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }] },
};

export default config;
