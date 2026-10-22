"use client";

import { Key } from "lucide-react";
import { useEffect, useState } from "react";
import ApiExamples from "@/components/api-examples";
import CopyButton from "@/components/copy-button";
import Loading from "@/components/loading";
import { DocsLink } from "@/components/site/panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import type { UserData } from "@/types";

const DISCORD_BOT_INVITE = "https://discord.com/oauth2/authorize?client_id=1365847380309704714&scope=bot&permissions=0";
const navyButton = "border border-navy-700 bg-navy-800 text-white hover:bg-navy-700";
const outlineButton = "border-navy-700 bg-navy-900 text-white hover:bg-navy-800 hover:text-white";
const field = "border-navy-700 bg-navy-800 text-neutral-200 focus:border-neutral-600";

/** 40 random letters and digits (about 238 bits), from the browser's secure RNG. */
function newApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 40);
}

function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-100">{title}</CardTitle>
        {description && <CardDescription className="text-neutral-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** API key, Discord notifications, and examples for the custom events API. */
export default function SettingsPage() {
  const { user } = useUser({ required: true });
  const { toast } = useToast();
  const [account, setAccount] = useState<Partial<UserData> | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftDiscordId, setDraftDiscordId] = useState<string | null>(null); // null = not editing

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<UserData>()
      .then(({ data, error }) => {
        if (error) toast({ title: "Couldn't load your settings", description: error.message, variant: "destructive" });
        setAccount(data ?? {});
      });
  }, [user, toast]);

  if (!user || !account) return <Loading text="Loading your API settings..." />;

  const fail = (title: string, error: unknown) =>
    toast({ title, description: error instanceof Error ? error.message : "Please try again.", variant: "destructive", duration: 5000 });

  async function issueApiKey() {
    if (!user) return;
    const replacing = Boolean(account?.api);
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email, api: newApiKey() })
        .select()
        .single<UserData>();
      if (error) throw error;
      setAccount(data);
      if (replacing) {
        toast({ title: "API key regenerated", description: "The previous key no longer works.", duration: 5000 });
      }
    } catch (error) {
      fail("Couldn't create an API key", error);
    } finally {
      setBusy(false);
    }
  }

  async function saveDiscordId() {
    if (!user || draftDiscordId === null) return;
    try {
      const { error } = await supabase.from("users").update({ discord_id: draftDiscordId.trim() }).eq("id", user.id);
      if (error) throw error;
      setAccount({ ...account, discord_id: draftDiscordId.trim() });
      setDraftDiscordId(null);
      toast({ title: "Discord ID updated", duration: 3000 });
    } catch (error) {
      fail("Couldn't save your Discord ID", error);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-white">API Settings</h1>
      <div className="space-y-8">
        <Section
          title="Documentation"
          description="Setup guides for the tracking script, custom events and Discord alerts."
        >
          <p className="text-sm text-neutral-400">
            Read the <DocsLink>GitHub documentation</DocsLink> for detailed guides.
          </p>
        </Section>

        <Section
          title="Discord Integration"
          description="Get a Discord DM from Analytica Bot every time your site sends a custom event."
        >
          <label htmlFor="discord-id" className="text-sm font-medium text-neutral-300">
            Discord User ID:
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="discord-id"
              value={draftDiscordId ?? account.discord_id ?? ""}
              onChange={(e) => setDraftDiscordId(e.target.value)}
              placeholder="Enter your Discord User ID"
              disabled={draftDiscordId === null}
              className={field}
            />
            {draftDiscordId === null ? (
              <Button onClick={() => setDraftDiscordId(account.discord_id ?? "")} className={navyButton}>
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={saveDiscordId} className={navyButton}>
                  Save
                </Button>
                <Button onClick={() => setDraftDiscordId(null)} variant="outline" className={outlineButton}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            To find it, turn on Developer Mode in Discord (User Settings → Advanced), then right-click your name and choose
            &quot;Copy User ID&quot;. Discord only delivers DMs from bots you share a server with, so{" "}
            <a href={DISCORD_BOT_INVITE} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              add Analytica Bot to a server you&apos;re in
            </a>
            .
          </p>
        </Section>

        <Section
          title="API Key Management"
          description="Send this key with every custom event. Keep it secret; regenerating it stops the old key from working."
        >
          {account.api ? (
            <div className="space-y-4">
              <label htmlFor="api-key" className="text-sm font-medium text-neutral-300">
                Your API Key:
              </label>
              <div className="flex items-center gap-2">
                <Input id="api-key" value={account.api} readOnly className={field} />
                <CopyButton text={account.api} what="API key" className={outlineButton} />
              </div>
              <div className="flex justify-end">
                <Button onClick={issueApiKey} disabled={busy} variant="outline" className={outlineButton}>
                  <Key className="mr-2 h-4 w-4" /> Regenerate Key
                </Button>
              </div>
              <p className="text-xs text-neutral-400">
                <span className="font-semibold text-yellow-400">Security Notice:</span> If you think your key leaked,
                regenerate it. The old key stops working immediately.
              </p>
            </div>
          ) : (
            <Button onClick={issueApiKey} disabled={busy} className={`w-full ${navyButton}`}>
              <Key className="mr-2 h-5 w-5" /> Generate API Key
            </Button>
          )}
        </Section>

        <Section title="Usage Instructions">
          <p className="mb-4 text-sm text-neutral-400">
            Send a custom event from your server or app. Both examples check the response and report errors.
          </p>
          <ApiExamples />
        </Section>
      </div>
    </main>
  );
}
