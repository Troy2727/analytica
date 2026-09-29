import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import AnimatedBackground from "@/components/animated-background";
import Script from "next/script";

const geist = Geist({ subsets: ["latin"] });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Analytica - Real-time Analytics for Modern Applications",
  description:
    "Privacy-focused website analytics and event tracking tool for developers. Monitor user journeys, capture custom events, and get real-time insights with customizable tracking and Discord notifications.",
  keywords: [
    "web analytics",
    "event tracking",
    "real-time analytics",
    "developer tools",
    "privacy focused",
    "website monitoring",
    "user tracking",
    "discord notifications",
    "performance insights",
  ],
  authors: [
    {
      name: "Alex Mieses",
      url: "https://github.com/Troy2727",
    },
  ],
  creator: "Alex Mieses",
  publisher: "Analytica",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://analytica-phi.vercel.app",
    title: "Analytica - Real-time Analytics for Modern Applications",
    description:
      "Privacy-focused website analytics and event tracking tool for developers. Monitor user journeys, capture custom events, and get real-time insights.",
    siteName: "Analytica",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Analytica - Real-time Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytica - Real-time Analytics for Modern Applications",
    description:
      "Privacy-focused website analytics and event tracking tool for developers",
    creator: "@AlexMieses27",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-slate-950 text-neutral-50 ${geist.className} ${display.variable} antialiased`}
      >
        <AnimatedBackground />
        <Header />
        {children}
        <Analytics />
        <Toaster />
        <Footer />

        <Script
          defer
          data-domain="analytica-phi.vercel.app"
          src="https://analytica-phi.vercel.app/tracking-script.js"
        />
      </body>
    </html>
  );
}
