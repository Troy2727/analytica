import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { LargeGradientText } from "@/components/ui/large-gradient-text";

export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-center py-12 px-4 space-y-8 border-t border-white/10">
      <div className="mb-4">
        <LargeGradientText text="analytica" />
      </div>

      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-neutral-500">
        <Link
          href="https://github.com/Troy2727/analytica#readme"
          className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Documentation
        </Link>
        <Link
          href="/dashboard"
          className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/settings"
          className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Settings & API Keys
        </Link>
      </nav>

      <div className="flex items-center space-x-6">
        <Link
          href="https://github.com/Troy2727/analytica"
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </Link>
        <Link
          href="https://x.com/AlexMieses27"
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="h-5 w-5" />
          <span className="sr-only">X</span>
        </Link>
      </div>

      <p className="text-sm text-neutral-500">
        © 2026 Analytica. Complete analytics and monitoring for modern applications.
      </p>
    </footer>
  );
}
