"use client";

import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InstallSnippet from "@/components/install-snippet";
import DeleteWebsiteButton from "@/components/site/delete-website-button";
import { Panel } from "@/components/site/panel";

/** Shown until a site records its first page view: install steps, refresh, or delete. */
export default function WaitingForData({ domain }: { domain: string }) {
  return (
    <div className="mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-[700px] rounded-2xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black shadow-2xl backdrop-blur-xl">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <p className="flex items-center gap-4 text-lg text-neutral-400">
            <span className="h-4 w-4 animate-pulse rounded-full bg-white" />
            Waiting for the first page view...
          </p>
          <div className="mt-8 w-full border-y border-navy-800 py-4">
            <Panel>
              <CardHeader className="py-5">
                <CardTitle className="flex items-center gap-2 text-lg text-neutral-300 md:text-xl">
                  <Code className="h-4 w-4 md:h-5 md:w-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstallSnippet domain={domain} />
              </CardContent>
            </Panel>
          </div>
          <div className="flex w-full gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 border border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700"
            >
              Refresh
            </Button>
            <DeleteWebsiteButton
              domain={domain}
              className="border-red-800 bg-red-900/80 text-red-100 hover:bg-red-900"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
