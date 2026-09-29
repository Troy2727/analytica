"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { UserNav } from "@/components/ui/user-nav";
import useUser from "@/hooks/useUser";
import { useEffect } from "react";
import { GradientText } from "@/components/ui/gradient-text";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();

  const protectedPaths = ["/dashboard", "/settings"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname?.startsWith(path)
  );

  useEffect(() => {
    if (!loading && !user && isProtectedPath) {
      router.push("/sign-in");
    }
  }, [user, loading, isProtectedPath, router]);

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-white/5 px-4 shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-mark-v3.png"
                alt="Analytica Logo"
                width={32}
                height={32}
              />
            </Link>
            <Link href="/" className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              <GradientText>
                Analytica
              </GradientText>
            </Link>
          </div>
          <div className="flex items-center md:space-x-4">
            {!loading &&
              (user ? (
                <UserNav />
              ) : (
                <Button
                  onClick={handleSignIn}
                  className="rounded-lg bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5"
                >
                  Sign In
                </Button>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}