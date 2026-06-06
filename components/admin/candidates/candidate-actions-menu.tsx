"use client";

import Link from "next/link";
import { CheckCircle2, MoreVertical, ShieldOff, UserRound } from "lucide-react";

import type {
  AdminCandidate,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAdminCandidateHref } from "@/lib/format/candidates";

export function CandidateActionsMenu({
  candidate,
  onStatusChange,
}: {
  candidate: AdminCandidate;
  onStatusChange: (uid: string, status: CandidateRosterStatus) => void;
}) {
  const nextStatus = candidate.status === "active" ? "inactive" : "active";

  return (
    <DropdownMenu modal={false}>
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
        <DropdownMenuItem
          className="rounded-xl px-3 py-2"
          onClick={() => onStatusChange(candidate.uid, nextStatus)}
          variant={candidate.status === "active" ? "destructive" : "default"}
        >
          {candidate.status === "active" ? (
            <ShieldOff className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {candidate.status === "active" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
