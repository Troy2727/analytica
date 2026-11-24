"use client";

import { ArrowUpRight, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import CopyButton from "@/components/copy-button";
import { Panel } from "@/components/site/panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShareToken, getShareToken, revokeShareToken, shareUrl } from "@/lib/share-links";
import { supabase } from "@/lib/supabase";

type State =
  | { status: "loading" }
  | { status: "none"; websiteId: string }
  | { status: "active"; websiteId: string; token: string }
  | { status: "error"; message: string };

const NOTE = "Anyone with this link can view this website's traffic and performance. Custom events are not shared.";

/** Settings panel to create, copy, open and revoke the website's public read-only link. */
export default function ShareLinkPanel({ domain }: { domain: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [busy, setBusy] = useState<"creating" | "revoking" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    (async () => {
      const { data: site, error } = await supabase.from("websites").select("id").eq("name", domain).maybeSingle();
      if (error || !site) throw error ?? new Error("Website not found");
      const token = await getShareToken(site.id);
      if (current) setState(token ? { status: "active", websiteId: site.id, token } : { status: "none", websiteId: site.id });
    })().catch((error) => {
      console.error("Loading the share link failed:", error);
      if (current) setState({ status: "error", message: "Could not load the share link." });
    });
    return () => {
      current = false;
    };
  }, [domain]);

  async function create(websiteId: string) {
    setBusy("creating");
    setActionError(null);
    try {
      setState({ status: "active", websiteId, token: await createShareToken(websiteId) });
    } catch (error) {
      console.error("Creating the share link failed:", error);
      setActionError("Could not create the share link. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(websiteId: string) {
    setBusy("revoking");
    setActionError(null);
    try {
      await revokeShareToken(websiteId);
      setState({ status: "none", websiteId });
    } catch (error) {
      console.error("Revoking the share link failed:", error);
      setActionError("Could not revoke the share link. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const url = state.status === "active" ? shareUrl(window.location.origin, domain, state.token) : "";

  return (
    <Panel>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm text-neutral-300 md:text-base lg:text-lg">
          <Link2 className="h-4 w-4 md:h-5 md:w-5" />
          Share Link
        </CardTitle>
        <p className="mt-2 text-sm text-neutral-400">{NOTE}</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-900/30 to-black/50 p-4">
          {state.status === "loading" && <div aria-label="Loading share link" className="h-9 animate-pulse rounded-md bg-navy-800/60" />}

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          {state.status === "none" && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-neutral-400 md:text-sm">No share link yet. Create one to give read-only access.</p>
              <Button
                onClick={() => create(state.websiteId)}
                disabled={busy !== null}
                className="bg-gradient-to-r from-blue-400 to-emerald-400 text-navy-950 hover:opacity-90"
              >
                {busy === "creating" ? "Creating..." : "Create share link"}
              </Button>
            </div>
          )}

          {state.status === "active" && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                readOnly
                value={url}
                aria-label="Share link"
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 truncate rounded-md border border-navy-800 bg-navy-900/60 px-3 py-2 font-mono text-xs text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-2">
                <CopyButton text={url} what="Share link" />
                <Button asChild variant="ghost" size="sm" className="border border-navy-800 text-neutral-400 hover:bg-navy-800 hover:text-neutral-100">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={busy !== null} className="border-red-900/40 bg-transparent text-red-300 hover:bg-red-900/30 hover:text-red-200">
                      {busy === "revoking" ? "Revoking..." : "Revoke"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-navy-800 bg-navy-900">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-neutral-100">Revoke the share link?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Anyone using this link will lose access immediately. You can create a new link later; it will have a different address.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revoke(state.websiteId)} className="bg-red-900 text-red-100 hover:bg-red-900/80">
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {actionError && <p className="mt-3 text-sm text-red-400">{actionError}</p>}
        </div>
      </CardContent>
    </Panel>
  );
}
