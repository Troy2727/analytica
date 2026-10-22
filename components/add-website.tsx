"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runPageSpeed } from "@/actions/pagespeed";
import InstallSnippet from "@/components/install-snippet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

const brandButton =
  "rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg shadow-blue-900/30 hover:opacity-90";

/** Why `domain` can't be added as typed, or null if it looks like a bare domain. */
function domainProblem(domain: string): string | null {
  if (/https?|:\/\/|\//.test(domain)) return "Please enter the domain only (e.g., google.com).";
  return null;
}

/**
 * Two steps: register the domain (and run a first PageSpeed analysis), then
 * show the install snippet for it.
 */
export default function AddWebsite() {
  const router = useRouter();
  const { user } = useUser();
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [metricsFailed, setMetricsFailed] = useState(false);

  const problem = domainProblem(domain);

  async function add() {
    if (!user || !domain || problem || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { count } = await supabase
        .from("websites")
        .select("id", { count: "exact", head: true })
        .eq("name", domain);
      if (count) {
        setError("This domain has already been added.");
        return;
      }

      const { error: insertError } = await supabase.from("websites").insert({ name: domain, user_id: user.id });
      if (insertError) throw insertError;

      // A first Lighthouse run so the Performance tab isn't empty. Failing here is fine.
      setMetricsFailed(!(await runPageSpeed(domain, `https://${domain}`)));
      setAdded(true);
    } catch (err) {
      console.error("Adding website failed:", err);
      setError("Failed to add website. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-0 bg-transparent text-neutral-50">
      <CardHeader>
        <CardTitle>Add Website</CardTitle>
        <CardDescription className="text-neutral-300">Add your website to start tracking analytics</CardDescription>
      </CardHeader>
      <CardContent>
        {added ? (
          <div className="space-y-8">
            {metricsFailed && (
              <p className="rounded-md bg-amber-400/10 p-3 text-sm text-amber-400">
                Couldn&apos;t run a performance analysis yet. You can run one later from the site&apos;s Performance tab.
              </p>
            )}
            <InstallSnippet domain={domain} />
            <Button variant="secondary" onClick={() => router.push(`/site/${domain}`)}>
              Continue to See Analytics
            </Button>
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain
              </label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value.trim().toLowerCase())}
                placeholder="example.com"
                className={`rounded-xl border-blue-400/20 bg-black/30 text-white ${problem || error ? "border-red-500" : ""}`}
              />
              <p className={`text-sm ${problem || error ? "text-red-500" : "text-neutral-300"}`}>
                {problem ?? error ?? "Enter the domain or subdomain without “www”"}
              </p>
            </div>
            {!problem && (
              <Button type="submit" className={brandButton} disabled={saving || !domain}>
                {saving ? "Adding & Analyzing..." : "Add Website"}
              </Button>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
