"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/** Film-grain texture that jitters over the page, like a lost TV signal. */
function Static() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-[100%] opacity-[0.15]"
      style={{ backgroundImage: 'url("/noise.png")' }}
      initial={{ x: "-10%", y: "-10%" }}
      animate={{ x: "10%", y: "10%" }}
      transition={{ duration: 0.2, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
    />
  );
}

export default function NotFound() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid h-screen place-content-center gap-6 bg-neutral-950 p-8 text-center">
        <h1 className="text-6xl font-black text-neutral-50">404 - Data Not Found</h1>
        <p className="text-neutral-400">This page isn&apos;t in our data. Maybe it was never tracked 📊</p>
        <div className="flex justify-center gap-3 font-semibold">
          <Link href="/" className="rounded-md border px-4 py-2 text-neutral-200 transition-colors hover:bg-neutral-800">
            Return to Analytics
          </Link>
          <Link href="/dashboard" className="rounded-md bg-neutral-200 px-4 py-2 text-neutral-700 transition-colors hover:bg-neutral-50">
            Dashboard
          </Link>
        </div>
      </div>
      <Static />
    </main>
  );
}
