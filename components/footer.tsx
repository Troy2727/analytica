import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import { GradientText } from "@/components/gradient-text";

const PAGES = [
  { href: "https://github.com/Troy2727/analytica#readme", label: "Documentation" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings & API Keys" },
];

const SOCIAL = [
  { href: "https://github.com/Troy2727/analytica", label: "GitHub", icon: Github },
  { href: "https://x.com/AlexMieses27", label: "X", icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-8 border-t border-white/10 px-4 py-12 text-neutral-500">
      <GradientText as="p" className="mb-4 text-6xl font-bold tracking-tighter md:text-8xl">
        analytica
      </GradientText>
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
        {PAGES.map((page) => (
          <Link key={page.label} href={page.href} className="transition-colors hover:text-neutral-300">
            {page.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-6">
        {SOCIAL.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-neutral-300"
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        ))}
      </div>
      <p className="text-sm">© 2026 Analytica. Complete analytics and monitoring for modern applications.</p>
    </footer>
  );
}
