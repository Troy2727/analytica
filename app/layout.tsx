import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

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
      name: "Arjun",
      url: "https://github.com/arjuncodess",
    },
  ],
  creator: "Arjun",
  publisher: "Analytica",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://analytica.vercel.app",
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
    creator: "@arjuncodess",
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
        className={`bg-gradient-to-b from-black to-neutral-950 text-neutral-50 ${inter.className} antialiased`}
      >
        <Header />
        {children}
        <Analytics />
        <Toaster />
        <Footer />

        <Script
          defer
          data-domain="analytica.vercel.app"
          src="https://analytica.vercel.app/tracking-script.js"
        />
      </body>
    </html>
  );
}
