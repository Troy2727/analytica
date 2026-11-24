"use client";

import { Filter, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FunnelChart, FunnelMeta } from "@/components/site/funnel-view";
import { FunnelDialog, GoalDialog } from "@/components/site/goal-dialogs";
import { Panel } from "@/components/site/panel";
import { RankedList, type RankedRow } from "@/components/site/ranked-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildSessions } from "@/lib/analytics";
import { formatRate } from "@/lib/format";
import { deleteDefinition, listDefinitions } from "@/lib/goal-definitions";
import { funnelStats, goalStats, sessionPaths } from "@/lib/goals";
import { isMissingTable } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Funnel, Goal, PageView } from "@/types";

const MAX_GOALS = 25;
const MAX_FUNNELS = 10;
const glassButton = "border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80";
const iconButton =
  "rounded-md p-1.5 text-neutral-400 hover:bg-navy-800 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40";

type Definitions =
  | { status: "loading" }
  | { status: "error"; missingTable: boolean }
  | { status: "ready"; goals: Goal[]; funnels: Funnel[] };

type Editing = { kind: "goal"; item: Goal | null } | { kind: "funnel"; item: Funnel | null } | null;
type Deleting = { kind: "goal"; item: Goal } | { kind: "funnel"; item: Funnel } | null;

const funnelKey = (domain: string) => `analytica:goals:funnel:${domain}`;

function readStoredFunnel(domain: string): string | null {
  try {
    return localStorage.getItem(funnelKey(domain));
  } catch {
    return null;
  }
}

function EmptyState({ icon: Icon, text, action, onAction }: { icon: typeof Target; text: string; action: string; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Icon className="h-8 w-8 text-neutral-500" />
      <p className="text-sm text-neutral-300">{text}</p>
      <Button onClick={onAction} className="bg-gradient-to-r from-blue-400 to-emerald-400 text-navy-950 hover:opacity-90">
        {action}
      </Button>
    </div>
  );
}

/** Owner-only Goals tab: goal conversions and funnels over the loaded page views. */
export default function GoalsTab({ websiteId, domain, pageViews }: { websiteId: string; domain: string; pageViews: PageView[] }) {
  const [defs, setDefs] = useState<Definitions>({ status: "loading" });
  const [view, setView] = useState<"goals" | "funnels">("goals");
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [funnelId, setFunnelId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDefs({ status: "ready", ...(await listDefinitions(websiteId)) });
    } catch (error) {
      console.error("Loading goals failed:", error);
      setDefs({ status: "error", missingTable: isMissingTable(error) });
    }
  }, [websiteId]);

  useEffect(() => {
    load();
    setFunnelId(readStoredFunnel(domain));
  }, [load, domain]);

  const sessions = useMemo(() => sessionPaths(buildSessions(pageViews)), [pageViews]);

  const goals = useMemo(() => (defs.status === "ready" ? defs.goals : []), [defs]);
  const funnels = defs.status === "ready" ? defs.funnels : [];
  const funnel = funnels.find((f) => f.id === funnelId) ?? funnels[0] ?? null;
  const stats = useMemo(() => (funnel ? funnelStats(sessions, funnel.steps) : null), [funnel, sessions]);
  const rankedGoals = useMemo(
    () =>
      goals
        .map((goal) => ({ goal, stats: goalStats(sessions, goal.pattern) }))
        .sort((a, b) => b.stats.uniques - a.stats.uniques || a.goal.name.localeCompare(b.goal.name)),
    [goals, sessions]
  );
  // The delete dialog keeps showing its item while it animates closed.
  const [lastDeleting, setLastDeleting] = useState<Deleting>(null);
  useEffect(() => {
    if (deleting) setLastDeleting(deleting);
  }, [deleting]);
  const shownDeleting = deleting ?? lastDeleting;

  function selectFunnel(id: string) {
    setFunnelId(id);
    try {
      localStorage.setItem(funnelKey(domain), id);
    } catch {
      // storage blocked: the choice lasts for this page only
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteFailed(false);
    try {
      await deleteDefinition(deleting.kind === "goal" ? "goals" : "funnels", deleting.item.id);
      setDeleting(null);
      await load();
    } catch (error) {
      console.error("Deleting failed:", error);
      setDeleteFailed(true);
    }
  }

  const goalRows: RankedRow[] = rankedGoals.map(({ goal, stats: g }) => ({
      key: goal.id,
      count: g.uniques,
      content: (
        <span className="block min-w-0">
          <span className="block truncate">{goal.name}</span>
          <span className="block break-all text-xs text-neutral-500 sm:truncate">Visit {goal.pattern}</span>
        </span>
      ),
      details: [
        { label: "Total", value: g.total.toLocaleString("en-US"), suffix: "total" },
        { label: "CR", value: formatRate(g.rate), suffix: "CR" },
      ],
      actions: (
        <>
          <button type="button" className={iconButton} aria-label={`Edit goal ${goal.name}`} onClick={() => setEditing({ kind: "goal", item: goal })}>
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" className={iconButton} aria-label={`Delete goal ${goal.name}`} onClick={() => setDeleting({ kind: "goal", item: goal })}>
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ),
    }));

  const atLimit = view === "goals" ? goals.length >= MAX_GOALS : funnels.length >= MAX_FUNNELS;
  const newItem = () => setEditing(view === "goals" ? { kind: "goal", item: null } : { kind: "funnel", item: null });

  return (
    <div className="space-y-4 duration-300 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-3">
        <div role="tablist" aria-label="Goals or funnels" className="flex gap-3.5">
          {(["goals", "funnels"] as const).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "-my-2 border-b-2 py-2 text-xs font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40",
                view === key ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              {key}
            </button>
          ))}
        </div>
        {defs.status === "ready" && (
          <div className="flex items-center gap-2">
            {atLimit && (
              <span className="text-xs text-neutral-500">
                Limit of {view === "goals" ? `${MAX_GOALS} goals` : `${MAX_FUNNELS} funnels`} reached
              </span>
            )}
            <Button size="sm" variant="outline" className={glassButton} disabled={atLimit} onClick={newItem}>
              <Plus className="mr-1 h-4 w-4" />
              {view === "goals" ? "New goal" : "New funnel"}
            </Button>
          </div>
        )}
      </div>

      {defs.status === "ready" && sessions.length === 0 && (
        <p className="text-xs text-neutral-500">
          No session data for this range. Goals and funnels count tracked sessions only. Page views recorded before
          session tracking was added are not included.
        </p>
      )}

      {defs.status === "loading" && (
        <Panel>
          <CardContent className="space-y-2 p-5" aria-label="Loading goals">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-navy-800/40" />
            ))}
          </CardContent>
        </Panel>
      )}

      {defs.status === "error" && (
        <Panel>
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center text-sm text-neutral-100">
            {defs.missingTable ? (
              <p>
                Goals need a database update. Apply <code>supabase/migrations/009_goals_funnels.sql</code> to your
                Supabase project, then reload.
              </p>
            ) : (
              <p>Goals couldn&apos;t be loaded.</p>
            )}
            <Button variant="outline" className={glassButton} onClick={() => (setDefs({ status: "loading" }), load())}>
              Retry
            </Button>
          </CardContent>
        </Panel>
      )}

      {defs.status === "ready" && view === "goals" && (
        <RankedList
          title="Goal conversions"
          icon={Target}
          rows={goalRows}
          header={{ label: "Goal", count: "Uniques" }}
          empty={
            <EmptyState
              icon={Target}
              text="Measure how often visitors reach a page that matters"
              action="Create your first goal"
              onAction={() => setEditing({ kind: "goal", item: null })}
            />
          }
        />
      )}

      {defs.status === "ready" && view === "funnels" && (
        <Panel>
          {funnel && stats ? (
            <>
              <CardHeader className="flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap sm:items-center">
                <Select value={funnel.id} onValueChange={selectFunnel}>
                  <SelectTrigger aria-label="Funnel" className={`w-full max-w-xs ${glassButton}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 max-w-[calc(100vw-2rem)] border-navy-800 bg-navy-900 text-neutral-100">
                    {funnels.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="focus:bg-navy-800 [&>span:last-child]:truncate">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FunnelMeta stats={stats} />
                <div className="flex sm:ml-auto">
                  <button type="button" className={iconButton} aria-label={`Edit funnel ${funnel.name}`} onClick={() => setEditing({ kind: "funnel", item: funnel })}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconButton} aria-label={`Delete funnel ${funnel.name}`} onClick={() => setDeleting({ kind: "funnel", item: funnel })}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <FunnelChart stats={stats} chartKey={funnel.id} />
              </CardContent>
            </>
          ) : (
            <EmptyState
              icon={Filter}
              text="See where visitors drop off between pages"
              action="Create your first funnel"
              onAction={() => setEditing({ kind: "funnel", item: null })}
            />
          )}
        </Panel>
      )}

      {defs.status === "ready" && (
        <p className="text-xs text-neutral-500">
          Visitors are tracked sessions: one browser session counts once, however many pages it views.
        </p>
      )}

      {editing?.kind === "goal" && (
        <GoalDialog
          key={editing.item?.id ?? "new"}
          websiteId={websiteId}
          goal={editing.item}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => (setEditing(null), load())}
        />
      )}
      {editing?.kind === "funnel" && (
        <FunnelDialog
          key={editing.item?.id ?? "new"}
          websiteId={websiteId}
          funnel={editing.item}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => (setEditing(null), load())}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && (setDeleting(null), setDeleteFailed(false))}>
        <AlertDialogContent className="border-navy-800 bg-navy-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-100">
              Delete {shownDeleting?.kind} {shownDeleting?.item.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {shownDeleting?.kind === "goal"
                ? "Conversion numbers for it will no longer be shown. Your analytics data is not affected."
                : "Its step numbers will no longer be shown. Your analytics data is not affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep the dialog open until the delete finishes
                confirmDelete();
              }}
              className="bg-red-900 text-red-100 hover:bg-red-900/80"
            >
              {deleteFailed ? "Delete failed, try again" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
