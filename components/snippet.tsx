"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { SyntaxHighlighter, oneDark } from '@/lib/syntax-highlighter';

export default function Snippet() {
  const { website } = useParams();
  const { toast } = useToast();

  const react_snippet = `<script
  defer
  data-domain="${website}"
  src="https://analytica-phi.vercel.app/tracking-script.js"
>
</script>`;

  const next_snippet = `<Script
  defer
  data-domain="${website}"
  src="https://analytica-phi.vercel.app/tracking-script.js"
/>`;

  const copySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    toast({
      title: "Snippet Copied",
      description: "Installation snippet has been copied to clipboard",
      duration: 3000,
    });
  };

  return (
    <Card className="rounded-xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black">
      <CardContent className="pt-6">
        <Tabs defaultValue="JavaScript/React.js" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-navy-800/50">
            <TabsTrigger
              value="JavaScript/React.js"
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-neutral-100 text-neutral-400"
            >
              JavaScript / React.js
            </TabsTrigger>
            <TabsTrigger
              value="Next.js"
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-neutral-100 text-neutral-400"
            >
              Next.js
            </TabsTrigger>
          </TabsList>
          <TabsContent value="JavaScript/React.js" className="mt-4">
            <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-400">
                  Add to your index.html:
                </p>
                <Button
                  onClick={() => copySnippet(react_snippet)}
                  variant="ghost"
                  size="sm"
                  className="border border-navy-800 text-neutral-400 hover:text-neutral-100 hover:bg-navy-800"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <SyntaxHighlighter
                language="html"
                style={oneDark}
                customStyle={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  background: 'rgba(2, 6, 23, 0.7)',
                  overflowX: 'auto' as const,
                }}
              >
                {react_snippet}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
          <TabsContent value="Next.js" className="mt-4">
            <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-400">
                  Add to your app/layout.tsx:
                </p>
                <Button
                  onClick={() => copySnippet(next_snippet)}
                  variant="ghost"
                  size="sm"
                  className="border border-navy-800 text-neutral-400 hover:text-neutral-100 hover:bg-navy-800"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <SyntaxHighlighter
                language="jsx"
                style={oneDark}
                customStyle={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  background: 'rgba(2, 6, 23, 0.7)',
                  overflowX: 'auto' as const,
                }}
              >
                {next_snippet}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}