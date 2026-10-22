// Copy and sample data for the landing page, kept apart from its layout.

import { Activity, BellRing, Gauge, Gift, Layers, Radar, Sparkles, Zap } from "lucide-react";
import type { CodeSample } from "@/components/landing/code-tabs";
import type { PreviewMessage } from "@/components/landing/discord-preview";

const SITE = "https://analytica-phi.vercel.app";

// Tailwind needs full class names in the source, so each tint is spelled out.
export const TINTS = {
  blue: { card: "from-blue-900/20 border-blue-500/20 hover:border-blue-400/40", icon: "bg-blue-500/15 text-blue-300", tag: "bg-blue-500/20 text-blue-300", text: "text-blue-200/80" },
  emerald: { card: "from-emerald-900/20 border-emerald-500/20 hover:border-emerald-400/40", icon: "bg-emerald-500/15 text-emerald-300", tag: "bg-emerald-500/20 text-emerald-300", text: "text-emerald-200/80" },
  purple: { card: "from-purple-900/20 border-purple-500/20 hover:border-purple-400/40", icon: "bg-purple-500/15 text-purple-300", tag: "bg-purple-500/20 text-purple-300", text: "text-purple-200/80" },
  amber: { card: "from-amber-900/20 border-amber-500/20 hover:border-amber-400/40", icon: "bg-amber-500/15 text-amber-300", tag: "bg-amber-500/20 text-amber-300", text: "text-amber-200/80" },
};

export const HIGHLIGHTS = [
  { icon: Activity, tint: TINTS.blue, tag: "Real-time", value: "Live", label: "Page views as they happen" },
  { icon: BellRing, tint: TINTS.emerald, tag: "Alerts", value: "Instant", label: "Events sent to Discord" },
  { icon: Zap, tint: TINTS.purple, tag: "Script", value: "< 6KB", label: "Won't slow your site down" },
  { icon: Gift, tint: TINTS.amber, tag: "Open source", value: "$0", label: "Free forever" },
];

export const FEATURES = [
  {
    icon: Radar,
    tint: TINTS.blue,
    wide: false,
    title: "Traffic you can read at a glance",
    text: "Visits, page views, top pages and where people come from, charted by hour or by day.",
  },
  {
    icon: Layers,
    tint: TINTS.emerald,
    wide: true,
    title: "Know your audience",
    text: "See visitors' countries and cities, operating systems, devices and browsers, without storing anything personal about them.",
  },
  {
    icon: Sparkles,
    tint: TINTS.purple,
    wide: true,
    title: "Custom events with Discord alerts",
    text: "Send sign-ups, payments or errors from any backend with one HTTP request, and get a Discord DM the moment they happen.",
  },
  {
    icon: Gauge,
    tint: TINTS.amber,
    wide: false,
    title: "Lighthouse scores built in",
    text: "Run Google PageSpeed from the dashboard and get plain-language advice on what to fix first.",
  },
];

export const ALERTS: PreviewMessage[] = [
  {
    time: "Today at 5:20 PM",
    emoji: "💳",
    title: "Payment Failed",
    description: "A subscription renewal was declined. The customer was emailed a link to update their card.",
    fields: [
      { name: "Domain", value: "shop.example.com" },
      { name: "Plan", value: "Pro (yearly)" },
      { name: "Reason", value: "Card expired", wide: true },
    ],
  },
  {
    time: "Today at 5:38 PM",
    emoji: "🎉",
    title: "New Signup",
    description: "Someone created an account from the pricing page.",
    fields: [
      { name: "Domain", value: "app.example.com" },
      { name: "Source", value: "producthunt" },
      { name: "Country", value: "Canada" },
      { name: "Plan", value: "Free trial" },
    ],
  },
];

export const SETUP_SAMPLES: CodeSample[] = [
  {
    label: "HTML",
    language: "html",
    code: `<!-- In <head>, on every page you want to track -->\n<script\n  defer\n  data-domain="YOUR_DOMAIN"\n  src="${SITE}/tracking-script.js"\n></script>`,
  },
  {
    label: "Next.js",
    language: "jsx",
    code: `// app/layout.tsx\nimport Script from "next/script";\n\n<Script\n  defer\n  data-domain="YOUR_DOMAIN"\n  src="${SITE}/tracking-script.js"\n/>`,
  },
];

export const EVENT_SAMPLES: CodeSample[] = [
  {
    label: "JavaScript",
    language: "javascript",
    code: `await fetch("${SITE}/api/events", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    name: "new_signup",
    domain: "YOUR_DOMAIN",
    description: "A user signed up",
    emoji: "🎉",
    fields: [{ name: "Plan", value: "Pro", inline: true }],
  }),
});`,
  },
  {
    label: "Python",
    language: "python",
    code: `import requests

requests.post(
    "${SITE}/api/events",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "name": "new_signup",
        "domain": "YOUR_DOMAIN",
        "description": "A user signed up",
        "emoji": "🎉",
        "fields": [{"name": "Plan", "value": "Pro", "inline": True}],
    },
    timeout=10,
).raise_for_status()`,
  },
];

export const FAQ = [
  {
    q: "Is Analytica really free?",
    a: "Yes. It's free and open source, with no paid tier. You can also run your own copy with your own Supabase project.",
  },
  {
    q: "Will the script slow my site down?",
    a: "No. It's a few kilobytes, loads with defer so it never blocks rendering, and sends small JSON requests in the background.",
  },
  {
    q: "What do you store about visitors?",
    a: "The page URL, referrer source, rough location (city, region, country), operating system, device type and browser. No names, emails or IP addresses; the only thing kept in the visitor's browser is a random session ID.",
  },
  {
    q: "Does it work with my framework?",
    a: "Yes. It's one script tag, so it works with plain HTML, React, Next.js, Vue, Svelte and anything else that serves a web page, including single-page apps.",
  },
  {
    q: "How is it different from other analytics tools?",
    a: "Custom events and Discord alerts are included instead of being a paid add-on, PageSpeed scores live next to your traffic, and the whole codebase is open to read.",
  },
];
