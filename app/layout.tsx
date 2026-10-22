import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import Script from "next/script";
import AnimatedBackground from "@/components/animated-background";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const body = Geist({ subsets: ["latin"] });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

const SITE_URL = "https://analytica-phi.vercel.app";
const TITLE = "Analytica - Real-time Analytics for Modern Applications";
const DESCRIPTION =
  "Privacy-focused website analytics and event tracking for developers: page views, visitor sources, custom events with Discord alerts, and PageSpeed scores.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["web analytics", "event tracking", "real-time analytics", "developer tools", "discord notifications", "pagespeed"],
  authors: [{ name: "Alex Mieses", url: "https://github.com/Troy2727" }],
  creator: "Alex Mieses",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Analytica",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Analytica dashboard" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, creator: "@AlexMieses27", images: ["/og.png"] },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${body.className} ${display.variable} bg-slate-950 text-neutral-50 antialiased`}>
        <AnimatedBackground />
        <Header />
        {children}
        <Footer />
        <Toaster />
        <Analytics />
        {/* Analytica tracks its own site with the same script customers install. */}
        <Script defer data-domain="analytica-phi.vercel.app" src={`${SITE_URL}/tracking-script.js`} />
      </body>
    </html>
  );
}
