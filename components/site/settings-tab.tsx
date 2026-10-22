"use client";

import { Activity, BarChart2, Code, Download, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InstallSnippet from "@/components/install-snippet";
import DeleteWebsiteButton from "@/components/site/delete-website-button";
import { DocsLink, Panel } from "@/components/site/panel";
import { downloadCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2 text-sm text-neutral-300 md:text-base lg:text-lg">
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
      {children}
    </CardTitle>
  );
}

function ExportRow({
  icon: Icon,
  title,
  description,
  button,
  onExport,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  button: string;
  onExport: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onExport();
    } catch (error) {
      console.error(`${title} export failed:`, error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-900/30 to-black/50 p-4">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs font-medium text-neutral-100 md:text-sm">
          <Icon className="h-4 w-4" />
          {title}
        </p>
        <p className="text-xs text-neutral-400 md:text-sm">{description}</p>
      </div>
      <Button
        onClick={run}
        disabled={busy}
        variant="outline"
        className="border-navy-800 bg-navy-900/60 text-neutral-100 hover:bg-navy-950/40 hover:text-neutral-100"
      >
        <Download className="mr-2 h-4 w-4" />
        {busy ? "Downloading..." : button}
      </Button>
    </div>
  );
}

/** Install snippet, CSV exports, and deleting the website. */
export default function SettingsTab({ domain }: { domain: string }) {
  async function exportTraffic() {
    const [views, visits] = await Promise.all([
      supabase.from("page_views").select("*").eq("domain", domain),
      supabase.from("visits").select("*").eq("website_id", domain),
    ]);
    downloadCsv(views.data ?? [], `${domain}-page-views.csv`);
    downloadCsv(visits.data ?? [], `${domain}-visits.csv`);
  }

  async function exportEvents() {
    const { data } = await supabase
      .from("events")
      .select("id, event_name, message, domain, created_at")
      .eq("website_id", domain);
    downloadCsv(data ?? [], `${domain}-custom-events.csv`);
  }

  return (
    <div className="mx-auto w-full max-w-[95vw] space-y-6">
      <Panel className="overflow-hidden">
        <CardHeader className="pb-1 sm:pb-0">
          <SectionTitle icon={Code}>Installation</SectionTitle>
          <CardDescription className="mt-2 text-neutral-400">
            For detailed setup instructions and advanced usage, check our <DocsLink />.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-4 sm:p-6">
          <div className="min-w-[300px]">
            <InstallSnippet domain={domain} />
          </div>
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader className="pb-0">
          <SectionTitle icon={Download}>Export Data</SectionTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <ExportRow
            icon={BarChart2}
            title="Basic Analytics"
            description="Download page views and visits data"
            button="Download Analytics"
            onExport={exportTraffic}
          />
          <ExportRow
            icon={Activity}
            title="Custom Events"
            description="Download custom events data"
            button="Download Events"
            onExport={exportEvents}
          />
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader className="pb-0">
          <SectionTitle icon={Trash2}>Danger Zone</SectionTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between rounded-lg border border-red-900/10 bg-red-900/20 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-400 md:text-sm">Delete Website</p>
              <p className="text-xs text-neutral-400 md:text-sm">Permanently delete this website and all of its data</p>
            </div>
            <DeleteWebsiteButton domain={domain} />
          </div>
        </CardContent>
      </Panel>
    </div>
  );
}
