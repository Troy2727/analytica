"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { deleteWebsite } from "@/lib/websites";

/** "Delete Website" with a confirmation dialog; returns to the dashboard when done. */
export default function DeleteWebsiteButton({ domain, className }: { domain: string; className?: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    setFailed(false);
    try {
      await deleteWebsite(domain);
      router.push("/dashboard");
    } catch (error) {
      console.error("Deleting website failed:", error);
      setFailed(true);
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={deleting} className={className ?? "bg-red-900 text-red-100 hover:bg-red-900/60"}>
          {deleting ? "Deleting..." : failed ? "Delete failed, try again" : "Delete Website"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-navy-800 bg-navy-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-neutral-100">Delete {domain}?</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            This permanently deletes the website and all of its page views, visits and events. It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-navy-700 bg-navy-800 text-neutral-100 hover:bg-navy-700">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-red-900 text-red-100 hover:bg-red-900/80">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
