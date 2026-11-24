"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DuplicateNameError, saveFunnel, saveGoal } from "@/lib/goal-definitions";
import { validatePattern } from "@/lib/goals";
import type { Funnel, Goal } from "@/types";

const inputClass = "border-navy-800 bg-navy-950/60 text-neutral-100 placeholder:text-neutral-600";
const glassButton = "border-navy-800 bg-navy-900/20 text-neutral-100 backdrop-blur-sm hover:bg-navy-900/80";
const iconButton =
  "rounded-md p-1.5 text-neutral-400 hover:bg-navy-800 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40";
const PATH_ERROR = "Enter a page path such as /pricing or /blog*";
const MAX_STEPS = 8;
const MIN_STEPS = 2;

const FieldError = ({ children }: { children?: string | null }) =>
  children ? <p className="text-xs text-red-300">{children}</p> : null;

const nameError = (name: string) =>
  !name.trim() ? "Enter a name" : name.trim().length > 60 ? "Use at most 60 characters" : null;

/** A path input with the "Matches: /normalized" preview. */
function PatternField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const normalized = value.trim() ? validatePattern(value) : null;
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <Input
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/pricing or /blog*"
        className={`${inputClass} ${error ? "border-red-500" : ""}`}
      />
      {normalized && <p className="text-xs text-neutral-500">Matches: {normalized}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

function DialogShell({
  title,
  open,
  onOpenChange,
  saving,
  saveLabel,
  error,
  onSubmit,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  saveLabel: string;
  error: string | null;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-16px)] max-w-lg overflow-y-auto border-navy-800 bg-navy-900 text-neutral-100">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
          <FieldError>{error}</FieldError>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className={glassButton} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-400 to-emerald-400 text-navy-950 hover:opacity-90">
              {saving ? "Saving..." : saveLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Create or edit a goal. `goal` null = new. */
export function GoalDialog({
  websiteId,
  goal,
  open,
  onOpenChange,
  onSaved,
}: {
  websiteId: string;
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [pattern, setPattern] = useState(goal?.pattern ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const errors = {
    name: duplicate ? "A goal with that name already exists" : nameError(name),
    pattern: validatePattern(pattern) ? null : PATH_ERROR,
  };

  async function submit() {
    setSubmitted(true);
    setDuplicate(false);
    const normalized = validatePattern(pattern);
    if (nameError(name) || !normalized) return;
    setSaving(true);
    setError(null);
    try {
      await saveGoal(websiteId, { id: goal?.id, name: name.trim(), pattern: normalized });
      onSaved();
    } catch (err) {
      if (err instanceof DuplicateNameError) setDuplicate(true);
      else {
        console.error("Saving goal failed:", err);
        setError("Couldn't save. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell
      title={goal ? "Edit goal" : "New goal"}
      open={open}
      onOpenChange={onOpenChange}
      saving={saving}
      saveLabel="Save goal"
      error={error}
      onSubmit={submit}
    >
      <div className="space-y-1">
        <label htmlFor="goal-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="goal-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDuplicate(false);
          }}
          placeholder="Pricing page view"
          className={inputClass}
        />
        <FieldError>{submitted ? errors.name : null}</FieldError>
      </div>
      <div className="space-y-1">
        <label htmlFor="goal-pattern" className="text-sm font-medium">
          Page path
        </label>
        <PatternField id="goal-pattern" value={pattern} onChange={setPattern} error={submitted ? errors.pattern : null} />
        <p className="text-xs text-neutral-500">Use * as a wildcard. Query strings, trailing slashes and capital letters are ignored.</p>
      </div>
    </DialogShell>
  );
}

/** Create or edit a funnel of 2 to 8 ordered page paths. `funnel` null = new. */
export function FunnelDialog({
  websiteId,
  funnel,
  open,
  onOpenChange,
  onSaved,
}: {
  websiteId: string;
  funnel: Funnel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(funnel?.name ?? "");
  const [steps, setSteps] = useState<string[]>(funnel?.steps ?? ["", ""]);
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setStep = (index: number, value: string) => setSteps((all) => all.map((s, i) => (i === index ? value : s)));
  const move = (index: number, by: number) =>
    setSteps((all) => {
      const next = [...all];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  async function submit() {
    setSubmitted(true);
    setDuplicate(false);
    const normalized = steps.map(validatePattern);
    if (nameError(name) || normalized.some((s) => !s)) return;
    setSaving(true);
    setError(null);
    try {
      await saveFunnel(websiteId, { id: funnel?.id, name: name.trim(), steps: normalized as string[] });
      onSaved();
    } catch (err) {
      if (err instanceof DuplicateNameError) setDuplicate(true);
      else {
        console.error("Saving funnel failed:", err);
        setError("Couldn't save. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell
      title={funnel ? "Edit funnel" : "New funnel"}
      open={open}
      onOpenChange={onOpenChange}
      saving={saving}
      saveLabel="Save funnel"
      error={error}
      onSubmit={submit}
    >
      <div className="space-y-1">
        <label htmlFor="funnel-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="funnel-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDuplicate(false);
          }}
          placeholder="Sign-up flow"
          className={inputClass}
        />
        <FieldError>{submitted ? (duplicate ? "A funnel with that name already exists" : nameError(name)) : null}</FieldError>
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Steps (2 to 8, in order)</legend>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-2.5 w-5 shrink-0 text-right text-xs text-neutral-500">{index + 1}.</span>
              <PatternField
                id={`funnel-step-${index}`}
                label={`Step ${index + 1} page path`}
                value={step}
                onChange={(value) => setStep(index, value)}
                error={submitted && !validatePattern(step) ? PATH_ERROR : null}
              />
              <div className="mt-1 flex shrink-0">
                <button type="button" className={iconButton} aria-label="Move step up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  aria-label="Move step down"
                  disabled={index === steps.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  aria-label="Remove step"
                  disabled={steps.length <= MIN_STEPS}
                  onClick={() => setSteps((all) => all.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={glassButton}
          disabled={steps.length >= MAX_STEPS}
          onClick={() => setSteps((all) => [...all, ""])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add step
        </Button>
      </fieldset>
    </DialogShell>
  );
}
