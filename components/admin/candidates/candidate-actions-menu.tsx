"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  ShieldOff,
  UserRound,
} from "lucide-react";

import type {
  AdminCandidate,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAdminCandidateHref } from "@/lib/format/candidates";

export function CandidateActionsMenu({
  candidate,
  isUpdating,
  onStatusChange,
}: {
  candidate: AdminCandidate;
  isUpdating: boolean;
  onStatusChange: (uid: string, status: CandidateRosterStatus) => Promise<void>;
}) {
  const nextStatus = candidate.status === "active" ? "inactive" : "active";
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<CandidateRosterStatus | null>(null);

  async function handleStatusChange(status: CandidateRosterStatus) {
    setPendingStatus(status);

    try {
      await onStatusChange(candidate.uid, status);
      setConfirmDeactivateOpen(false);
      setMenuOpen(false);
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <AlertDialog
      open={confirmDeactivateOpen}
      onOpenChange={(open) => {
        if (pendingStatus === "inactive") {
          return;
        }

        setConfirmDeactivateOpen(open);

        if (!open) {
          setMenuOpen(false);
        }
      }}
    >
      <DropdownMenu
        modal={false}
        open={menuOpen}
        onOpenChange={(open) => {
          if (pendingStatus || confirmDeactivateOpen) {
            return;
          }

          setMenuOpen(open);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`More actions for ${candidate.name}`}
            className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2">
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
            <Link href={getAdminCandidateHref(candidate.uid)}>
              <UserRound className="h-4 w-4" />
              View profile
            </Link>
          </DropdownMenuItem>
          {candidate.status === "active" ? (
            <DropdownMenuItem
              className="rounded-xl px-3 py-2"
              disabled={isUpdating || pendingStatus !== null}
              onSelect={(event) => {
                event.preventDefault();
                setConfirmDeactivateOpen(true);
              }}
              variant="destructive"
            >
              {pendingStatus === "inactive" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}
              {pendingStatus === "inactive" ? "Deactivating" : "Deactivate"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="rounded-xl px-3 py-2"
              disabled={isUpdating || pendingStatus !== null}
              onSelect={(event) => {
                event.preventDefault();
                void handleStatusChange(nextStatus);
              }}
            >
              {pendingStatus === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {pendingStatus === "active" ? "Activating" : "Activate"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Deactivate candidate?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark {candidate.name} as inactive. They will remain in the
            list, but will not be able to access site functionality.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={pendingStatus === "inactive"}
            onClick={() => setMenuOpen(false)}
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={pendingStatus === "inactive"}
            onClick={(event) => {
              event.preventDefault();
              void handleStatusChange("inactive");
            }}
            variant="destructive"
          >
            {pendingStatus === "inactive" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldOff className="size-4" />
            )}
            {pendingStatus === "inactive" ? "Deactivating" : "Deactivate"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
