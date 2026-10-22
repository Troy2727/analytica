"use client";

import Image from "next/image";
import Link from "next/link";
import { GradientText } from "@/components/gradient-text";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";
import useUser from "@/hooks/useUser";

/** Floating glass top bar: logo, then the account menu or a sign-in button. */
export default function Header() {
  const { user, loading } = useUser();

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo-mark-v3.png" alt="Analytica logo" width={32} height={32} />
          <GradientText className="font-display text-xl font-semibold tracking-tight md:text-2xl">Analytica</GradientText>
        </Link>
        {!loading &&
          (user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              asChild
              className="rounded-lg bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          ))}
      </nav>
    </header>
  );
}
