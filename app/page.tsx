import React from "react";
import { Activity, BellRing, ChevronRight, Gift, Zap } from "lucide-react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { FEATURES } from "@/lib/constants";
import { MockDiscordUI } from "@/components/mock-discord-ui";
import { AnimatedList } from "@/components/ui/animated-list";
import { DiscordMessage } from "@/components/discord-message";
import Image from "next/image";
import Safari from "@/components/ui/safari";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CodeBlock from "@/components/code-block";

// Hero highlight cards. Class strings are written out in full so Tailwind can find them.
const HIGHLIGHTS = [
  {
    icon: Activity,
    tag: "Real-time",
    value: "Live",
    label: "Page views as they happen",
    card: "from-blue-900/20 border-blue-500/20 hover:border-blue-400/40",
    iconBox: "bg-blue-500/15 text-blue-300",
    tagBox: "bg-blue-500/20 text-blue-300",
    labelText: "text-blue-200/80",
  },
  {
    icon: BellRing,
    tag: "Alerts",
    value: "Instant",
    label: "Events sent to Discord",
    card: "from-emerald-900/20 border-emerald-500/20 hover:border-emerald-400/40",
    iconBox: "bg-emerald-500/15 text-emerald-300",
    tagBox: "bg-emerald-500/20 text-emerald-300",
    labelText: "text-emerald-200/80",
  },
  {
    icon: Zap,
    tag: "Script",
    value: "< 6KB",
    label: "Won't slow your site down",
    card: "from-purple-900/20 border-purple-500/20 hover:border-purple-400/40",
    iconBox: "bg-purple-500/15 text-purple-300",
    tagBox: "bg-purple-500/20 text-purple-300",
    labelText: "text-purple-200/80",
  },
  {
    icon: Gift,
    tag: "Open source",
    value: "$0",
    label: "Free forever",
    card: "from-amber-900/20 border-amber-500/20 hover:border-amber-400/40",
    iconBox: "bg-amber-500/15 text-amber-300",
    tagBox: "bg-amber-500/20 text-amber-300",
    labelText: "text-amber-200/80",
  },
];

// One tint per feature card; the middle two span two columns for the bento layout.
const FEATURE_TINTS = [
  { card: "from-blue-900/20 border-blue-400/20 hover:border-blue-400/40", icon: "bg-blue-500/15 text-blue-300", span: "" },
  { card: "from-emerald-900/20 border-emerald-400/20 hover:border-emerald-400/40", icon: "bg-emerald-500/15 text-emerald-300", span: "lg:col-span-2" },
  { card: "from-purple-900/20 border-purple-400/20 hover:border-purple-400/40", icon: "bg-purple-500/15 text-purple-300", span: "lg:col-span-2" },
  { card: "from-amber-900/20 border-amber-400/20 hover:border-amber-400/40", icon: "bg-amber-500/15 text-amber-300", span: "" },
];

export default function Home() {
  const setupSnippets = [
    {
      name: "JavaScript",
      language: "javascript",
      filename: "setup.js",
      code: `<script
  defer
  data-domain="YOUR_DOMAIN"
  src="https://analytica-phi.vercel.app/tracking-script.js"
>
</script>`,
    },
    {
      name: "Next.js",
      language: "javascript",
      filename: "setup.tsx",
      code: `<Script
  defer
  data-domain="YOUR_DOMAIN"
  src="https://analytica-phi.vercel.app/tracking-script.js"
/>`,
    },
  ];

  const eventSnippets = [
    {
      name: "JavaScript",
      language: "javascript",
      filename: "events.js",
      code: `const axios = require('axios');

const API_KEY = "YOUR_API_KEY";
const url = "https://analytica-phi.vercel.app/api/events";
const headers = {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${API_KEY}\`
};

const eventData = {
    name: "",        // required - event name
    domain: "",      // required - your website domain
    description: "", // required - event description
    emoji: "🔔",    // optional - emoji for Discord notification
    fields: [       // optional - additional fields for Discord notification
      {
        name: "Field Name",
        value: "Field Value",
        inline: true // optional - display fields in same line
      }
    ]
};

const sendRequest = async () => {
    try {
      const response = await axios.post(url, eventData, { headers });
      console.log("Event sent successfully", response.data);
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
    }
};

sendRequest();`,
    },
    {
      name: "Python",
      language: "python",
      filename: "events.py",
      code: `import requests

API_KEY = "YOUR_API_KEY"
url = "https://analytica-phi.vercel.app/api/events"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

event_data = {
    "name": "",        # required - event name
    "domain": "",      # required - your website domain
    "description": "", # required - event description
    "emoji": "🔔",    # optional - emoji for Discord notification
    "fields": [       # optional - additional fields for Discord notification
      {
        "name": "Field Name",
        "value": "Field Value",
        "inline": True # optional - display fields in same line
      }
    ]
}

def send_request():
    try:
        response = requests.post(url, json=event_data, headers=headers)
        response.raise_for_status()
        print("Event sent successfully", response.json())
    except requests.exceptions.RequestException as error:
        print("Error:", error)

send_request()`,
    },
  ];

  return (
    <main className="flex flex-col divide-y divide-white/10">
      <section className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-20 sm:pt-24 lg:grid-cols-5 lg:pt-28">
          <div className="lg:col-span-3">
            <BlurFade delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-sm text-blue-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Open source &amp; free forever
              </span>
            </BlurFade>

            <BlurFade delay={0.2}>
              <h1 className="mt-8 font-display text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Every visit.
                <br className="hidden sm:block" /> Every event.{" "}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Live.
                </span>
              </h1>
            </BlurFade>

            <BlurFade delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg text-gray-300 sm:text-xl">
                Monitor every aspect of your application in real-time. Track
                user journeys, capture events, and make data-driven decisions
                with our comprehensive analytics platform.
              </p>
            </BlurFade>

            <BlurFade delay={0.4}>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 px-8 py-4 font-medium text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5"
                >
                  Get Started
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  href="https://github.com/Troy2727/analytica#readme"
                  className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-medium text-gray-100 transition hover:border-white/20 hover:bg-white/10"
                >
                  View Documentation
                </Link>
              </div>
            </BlurFade>
          </div>

          <BlurFade delay={0.35} className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
              {HIGHLIGHTS.map((h) => {
                const Icon = h.icon;
                return (
                  <div
                    key={h.value}
                    className={`rounded-2xl border bg-gradient-to-br to-black p-6 backdrop-blur-xl transition-all duration-300 ${h.card}`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${h.iconBox}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${h.tagBox}`}>
                        {h.tag}
                      </span>
                    </div>
                    <p className="mb-1 font-display text-2xl font-light text-white lg:text-3xl">
                      {h.value}
                    </p>
                    <p className={`text-sm ${h.labelText}`}>{h.label}</p>
                  </div>
                );
              })}
            </div>
          </BlurFade>
        </div>

        <BlurFade delay={0.5} yOffset={20}>
          <div className="mx-auto max-w-7xl pb-16">
            <div className="overflow-hidden rounded-2xl border border-blue-400/20 shadow-2xl shadow-blue-950/50">
              <Safari url="https://analytica-phi.vercel.app">
                <Image
                  alt="Analytica dashboard"
                  src="/hero-dashboard-v5.jpg"
                  width={2609}
                  height={2020}
                />
              </Safari>
            </div>
          </div>
        </BlurFade>
      </section>

      <BlurFade delay={0.7}>
        <section className="py-14 md:py-20 relative">
          <div className="max-w-7xl mx-auto px-4 text-gray-400 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto sm:text-center">
              <h2 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
                Built for{" "}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  modern applications
                </span>
              </h2>
              <p className="mt-6 text-xl font-light text-gray-300">
                Powerful event tracking and analytics that scales with your
                application. Deploy in minutes and start monitoring your key
                metrics instantly.
              </p>
            </div>
            <div className="relative mt-16">
              <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8">
                {FEATURES.map((item, idx) => {
                  const tint = FEATURE_TINTS[idx % FEATURE_TINTS.length];
                  return (
                    <BlurFade
                      key={idx}
                      delay={0.8 + idx * 0.1}
                      className={`h-full ${tint.span}`}
                    >
                      <li
                        className={`flex h-full flex-col space-y-4 rounded-2xl border bg-gradient-to-br to-black p-8 backdrop-blur-xl transition-all duration-300 ${tint.card}`}
                      >
                        <div className={`w-fit rounded-xl p-3 ${tint.icon}`}>
                          {item.icon}
                        </div>
                        <h4 className="text-xl font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="flex-grow font-light text-gray-300">
                          {item.desc}
                        </p>
                      </li>
                    </BlurFade>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </BlurFade>

      <section className="py-14 relative">
        <div className="px-4 text-gray-400 md:px-8">
          <div className="relative max-w-3xl mx-auto sm:text-center mb-12">
            <BlurFade delay={1}>
              <div className="relative z-10">
                <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Real-time
                  </span>{" "}
                  event monitoring
                </h2>
                <p className="mt-6 text-xl font-light text-gray-300">
                  Get instant Discord notifications for critical events,
                  conversion milestones, and user activities. Stay on top of
                  your application&apos;s performance 24/7.
                </p>
              </div>
            </BlurFade>
          </div>

          <BlurFade delay={1.2}>
            <div className="h-full max-w-[1200px] mx-auto">
              <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-xl lg:p-6">
                <MockDiscordUI>
                  <AnimatedList delay={800}>
                    <DiscordMessage
                      avatarSrc="/logo-mark-v3.png"
                      avatarAlt="Analytica Avatar"
                      username="Analytica"
                      timestamp="Today at 5:20 PM"
                      title="New Event: Production Database Error"
                      description="A critical error has been detected in the production environment that requires immediate attention."
                      emoji="🚨"
                      fields={[
                        {
                          name: "Domain",
                          value: "something.vercel.app",
                          inline: true,
                        },
                        {
                          name: "Error Code",
                          value: "ERR_CONNECTION_LIMIT",
                          inline: true,
                        },
                        {
                          name: "Affected Services",
                          value: "User Authentication, Payment Processing",
                          inline: false,
                        },
                        {
                          name: "Timestamp",
                          value: "2024-03-20 15:30:45 UTC",
                          inline: true,
                        },
                        { name: "Current Load", value: "98%", inline: true },
                      ]}
                    />
                    <DiscordMessage
                      avatarSrc="/logo-mark-v3.png"
                      avatarAlt="Analytica Avatar"
                      username="Analytica"
                      timestamp="Today at 5:38 PM"
                      title="New Event: Performance Alert"
                      description="Performance degradation detected in application endpoints. This may affect user experience."
                      emoji="⚠️"
                      fields={[
                        { name: "Domain", value: "nothing.com", inline: true },
                        {
                          name: "Average Response Time",
                          value: "2.5s",
                          inline: true,
                        },
                        {
                          name: "Affected Region",
                          value: "EU WEST",
                          inline: true,
                        },
                        { name: "Impact Level", value: "Medium", inline: true },
                        {
                          name: "Recommended Action",
                          value:
                            "Scale up server instances and investigate potential bottlenecks",
                          inline: false,
                        },
                      ]}
                    />
                  </AnimatedList>
                </MockDiscordUI>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      <section className="py-14 relative">
        <div className="max-w-5xl mx-auto px-4 text-gray-400 md:px-8">
          <div className="relative max-w-3xl mx-auto sm:text-center mb-12">
            <div className="relative z-10">
              <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
                Copy. Paste. Deploy.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Simple as that.
                </span>
              </h2>
              <p className="mt-6 text-xl font-light text-gray-300">
                Get started quickly with ready-to-use code examples. Copy, paste
                and customize to integrate event tracking in minutes.
              </p>
            </div>
          </div>

          <CodeBlock
            setupFiles={setupSnippets}
            eventFiles={eventSnippets}
            className="shadow-2xl"
          />
        </div>
      </section>

      <section className="px-4 py-28 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-left sm:text-center font-display font-light tracking-tight text-white lg:leading-[1.15] text-4xl sm:text-5xl md:text-6xl">
              Analytics that work for <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                you and your team
              </span>
            </h2>
            <div className="text-[0.84rem] font-light text-gray-300 text-left sm:text-center md:text-lg max-w-2xl md:mx-auto">
              Track user behavior, monitor performance metrics, and receive
              real-time notifications across all your platforms. Get the
              insights you need to optimize your application and drive growth.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 px-8 py-4 font-medium text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5"
            >
              Start for FREE Forever
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="px-8 py-16">
          <div className="mx-auto max-w-3xl space-y-12">
            <div className="relative max-w-2xl mx-auto sm:text-center">
              <div className="relative">
                <h2 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl">
                  Frequently asked{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    questions
                  </span>
                </h2>
                <p className="mt-6 text-xl font-light text-gray-300">
                  Get answers to frequently asked questions about our analytics
                  platform. Learn how Analytica can help you track and understand
                  your website&apos;s performance while keeping your data
                  secure.
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-16 space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is Analytica really free?</AccordionTrigger>
                <AccordionContent>
                  Yes! We&apos;re 100% free and open source. There are no hidden
                  fees or premium features. You can even self-host it if you
                  want.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  Will this slow down my website?
                </AccordionTrigger>
                <AccordionContent>
                  Nope! Our tracking script is tiny (less than 6KB) and loads
                  asynchronously so it won&apos;t block your page. We use edge
                  functions for super-fast response times.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  Is my data private and secure?
                </AccordionTrigger>
                <AccordionContent>
                  Absolutely! We use Supabase for secure data storage. Your data
                  is never sold or shared, and you can delete it anytime. We
                  don&apos;t track personal user information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  Can I use this with any website?
                </AccordionTrigger>
                <AccordionContent>
                  Yes! Analytica works with Next.js, React, Vue, plain HTML, and
                  more. Our analytics solution is designed to be
                  framework-agnostic.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  What&apos;s the difference between Analytica and other analytics
                  tools?
                </AccordionTrigger>
                <AccordionContent>
                  Analytica stands out by offering free custom event tracking
                  (which others charge for), built-in Discord notifications, and
                  a privacy-focused approach. There&apos;s no complex setup
                  needed, and being completely open source means you have full
                  transparency and control.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </main>
  );
}
