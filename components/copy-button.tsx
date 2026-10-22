"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Copies `text` to the clipboard and confirms with a toast. */
export default function CopyButton({ text, what, className }: { text: string; what: string; className?: string }) {
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} copied`, description: "It's on your clipboard.", duration: 3000 });
    } catch {
      toast({ title: "Copy failed", description: "Select the text and copy it manually.", duration: 3000 });
    }
  }

  return (
    <Button
      onClick={copy}
      variant="ghost"
      size="sm"
      className={cn("border border-navy-800 text-neutral-400 hover:bg-navy-800 hover:text-neutral-100", className)}
    >
      <Copy className="mr-2 h-4 w-4" />
      Copy
    </Button>
  );
}
