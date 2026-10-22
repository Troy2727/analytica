"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { oneDark, SyntaxHighlighter } from "@/lib/syntax-highlighter";
import { cn } from "@/lib/utils";

export interface CodeSample {
  label: string;
  language: string;
  code: string;
}

/** A titled code window with one tab per sample and a copy button. */
export default function CodeTabs({ title, samples }: { title: string; samples: CodeSample[] }) {
  const [active, setActive] = useState(0);
  const { toast } = useToast();
  const sample = samples[active];

  async function copy() {
    await navigator.clipboard.writeText(sample.code);
    toast({ title: "Copied to clipboard", description: `${title} code for ${sample.label}.`, duration: 2000 });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-neutral-800 bg-white/5 px-4 py-2">
        <h3 className="font-medium text-white">{title}</h3>
        <div role="tablist" className="flex gap-2">
          {samples.map((s, i) => (
            <button
              key={s.label}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                i === active ? "bg-blue-600/80 text-white" : "text-neutral-400 hover:text-neutral-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative p-4 font-mono text-sm">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <SyntaxHighlighter
              language={sample.language}
              style={{ ...oneDark, backgroundColor: "transparent", margin: 0, padding: 0 }}
              showLineNumbers
              customStyle={{ margin: 0, background: "transparent", fontSize: "0.875rem", lineHeight: "1.5rem", overflowX: "auto" }}
            >
              {sample.code}
            </SyntaxHighlighter>
          </motion.div>
        </AnimatePresence>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="absolute right-2 top-2 rounded-md bg-neutral-800/50 p-1.5 text-neutral-400 transition-transform hover:scale-105 hover:text-white"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
