"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddWebsite from "@/components/add-website";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WebsiteCard } from "@/components/website-card";
import useUser from "@/hooks/useUser";
import { getWebsiteSummaries, type WebsiteSummary } from "@/lib/queries";

/** The signed-in user's websites, with an "Add Website" dialog. */
export default function DashboardPage() {
  const { user } = useUser({ required: true });
  const [sites, setSites] = useState<WebsiteSummary[] | null>(null);

  useEffect(() => {
    if (user) getWebsiteSummaries(user.id).then(setSites);
  }, [user]);

  if (!sites) return <Loading text="Getting your websites..." />;

  return (
    <main className="min-h-screen bg-navy-900/10 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-100">Your Websites</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg shadow-blue-900/30 hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-auto max-w-lg border-blue-400/20 bg-gradient-to-br from-navy-900 to-black p-4 sm:max-w-xl">
              <DialogTitle className="sr-only">Add a new website</DialogTitle>
              <AddWebsite />
            </DialogContent>
          </Dialog>
        </div>
        {sites.length === 0 ? (
          <p className="py-12 text-center text-neutral-400">No websites added yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <WebsiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
