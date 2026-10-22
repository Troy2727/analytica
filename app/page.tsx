import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CodeTabs from "@/components/landing/code-tabs";
import { ALERTS, EVENT_SAMPLES, FAQ, FEATURES, HIGHLIGHTS, SETUP_SAMPLES } from "@/components/landing/content";
import DiscordPreview from "@/components/landing/discord-preview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlurFade } from "@/components/ui/blur-fade";
import Safari from "@/components/ui/safari";

const ctaButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 px-8 py-4 font-medium text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5";

function Accent({ children }: { children: React.ReactNode }) {
  return <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{children}</span>;
}

/** Centered section heading with a short intro paragraph. */
function SectionIntro({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl sm:text-center">
      <h2 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-6 text-xl font-light text-gray-300">{children}</p>
    </div>
  );
}

function Hero() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-20 sm:pt-24 lg:grid-cols-5 lg:pt-28">
        <div className="lg:col-span-3">
          <BlurFade delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-sm text-blue-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Open source &amp; free forever
            </span>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h1 className="mt-8 font-display text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Every visit.
              <br className="hidden sm:block" /> Every event. <Accent>Live.</Accent>
            </h1>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="mt-8 max-w-2xl text-lg text-gray-300 sm:text-xl">
              Add one script tag and see who visits, where they come from and what they do, then get a Discord ping when
              something important happens.
            </p>
          </BlurFade>
          <BlurFade delay={0.4}>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/dashboard" className={ctaButton}>
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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, tint, tag, value, label }) => (
              <li key={tag} className={`rounded-2xl border bg-gradient-to-br to-black p-6 backdrop-blur-xl transition-all duration-300 ${tint.card}`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint.icon}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tint.tag}`}>{tag}</span>
                </div>
                <p className="mb-1 font-display text-2xl font-light text-white lg:text-3xl">{value}</p>
                <p className={`text-sm ${tint.text}`}>{label}</p>
              </li>
            ))}
          </ul>
        </BlurFade>
      </div>

      <BlurFade delay={0.5} yOffset={20}>
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-blue-400/20 pb-0 shadow-2xl shadow-blue-950/50">
          <Safari url="https://analytica-phi.vercel.app">
            <Image
              src="/hero-dashboard-v5.jpg"
              alt="The Analytica dashboard for a website"
              width={2609}
              height={2020}
              sizes="(min-width: 1280px) 1280px, 100vw"
              priority
            />
          </Safari>
        </div>
        <div className="pb-16" />
      </BlurFade>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col divide-y divide-white/10">
      <Hero />

      <section className="px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <BlurFade delay={0.7}>
          <SectionIntro
            title={
              <>
                Built for <Accent>modern applications</Accent>
              </>
            }
          >
            Everything you need to understand your traffic, in one dashboard you can set up in minutes.
          </SectionIntro>
        </BlurFade>
        <ul className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8">
          {FEATURES.map(({ icon: Icon, tint, wide, title, text }, i) => (
            <BlurFade key={title} delay={0.8 + i * 0.1} className={`h-full ${wide ? "lg:col-span-2" : ""}`}>
              <li className={`flex h-full flex-col gap-4 rounded-2xl border bg-gradient-to-br to-black p-8 backdrop-blur-xl transition-all duration-300 ${tint.card}`}>
                <span className={`w-fit rounded-xl p-3 ${tint.icon}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="font-light text-gray-300">{text}</p>
              </li>
            </BlurFade>
          ))}
        </ul>
      </section>

      <section className="px-4 py-14 md:px-8">
        <BlurFade delay={1}>
          <SectionIntro
            title={
              <>
                <Accent>Real-time</Accent> event monitoring
              </>
            }
          >
            Send an event from your backend and Analytica Bot DMs you on Discord with the details, seconds later.
          </SectionIntro>
        </BlurFade>
        <BlurFade delay={1.2}>
          <div className="mx-auto max-w-[1200px] rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-xl lg:p-6">
            <DiscordPreview messages={ALERTS} />
          </div>
        </BlurFade>
      </section>

      <section className="px-4 py-14 md:px-8">
        <SectionIntro
          title={
            <>
              Copy. Paste. Deploy.
              <br />
              <Accent>Simple as that.</Accent>
            </>
          }
        >
          One tag to start tracking, one request to send a custom event.
        </SectionIntro>
        <div className="mx-auto max-w-5xl space-y-5">
          <CodeTabs title="Setup" samples={SETUP_SAMPLES} />
          <CodeTabs title="Events" samples={EVENT_SAMPLES} />
        </div>
      </section>

      <section className="px-4 py-28">
        <div className="mx-auto max-w-4xl space-y-8 sm:text-center">
          <h2 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl lg:leading-[1.15]">
            Analytics that work for <br />
            <Accent>you and your team</Accent>
          </h2>
          <p className="mx-auto max-w-2xl font-light text-gray-300 md:text-lg">
            Traffic, performance and the events that matter to your business, all in one place and free to use.
          </p>
          <Link href="/dashboard" className={ctaButton}>
            Start for FREE Forever
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto max-w-3xl">
          <SectionIntro
            title={
              <>
                Frequently asked <Accent>questions</Accent>
              </>
            }
          >
            What Analytica tracks, what it costs, and how it compares.
          </SectionIntro>
          <Accordion type="single" collapsible className="mt-16 space-y-4">
            {FAQ.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`faq-${i}`}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}
