import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SharedDashboard from "@/components/site/shared-dashboard";
import { decodeDomain, resolveShare } from "@/lib/share-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared analytics - Analytica",
  robots: { index: false, follow: false },
};

/** A website's read-only dashboard, open to anyone holding a valid share link. */
export default async function SharePage({ params }: { params: Promise<{ website: string; token: string }> }) {
  const { website, token } = await params;
  const domain = decodeDomain(website);
  if (domain === null || !(await resolveShare(domain, token))) notFound();
  return <SharedDashboard domain={domain} token={token} />;
}
