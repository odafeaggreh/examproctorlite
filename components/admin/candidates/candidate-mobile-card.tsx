import Link from "next/link";

import type {
  AdminCandidate,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import { CandidateActionsMenu } from "@/components/admin/candidates/candidate-actions-menu";
import { CandidateAvatar } from "@/components/admin/candidates/candidate-avatar";
import { CandidateStatusBadge } from "@/components/admin/candidates/candidate-badges";
import {
  formatCandidateScore,
  getAdminCandidateHref,
} from "@/lib/format/candidates";

export function CandidateMobileCard({
  candidate,
  isUpdating,
  onStatusChange,
}: {
  candidate: AdminCandidate;
  isUpdating: boolean;
  onStatusChange: (uid: string, status: CandidateRosterStatus) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02),_0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CandidateAvatar candidate={candidate} />
          <div className="min-w-0">
            <Link
              href={getAdminCandidateHref(candidate.uid)}
              className="block truncate font-semibold text-slate-900"
            >
              {candidate.name}
            </Link>
            <p className="truncate text-xs text-slate-500">{candidate.email}</p>
          </div>
        </div>
        <CandidateActionsMenu
          candidate={candidate}
          isUpdating={isUpdating}
          onStatusChange={onStatusChange}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 text-xs text-slate-600">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Exams
          </span>
          <p className="mt-1 font-medium text-slate-700">
            {candidate.examStats.completed}/{candidate.examStats.assigned}{" "}
            completed
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Average
          </span>
          <p className="mt-1 font-medium text-slate-700">
            {formatCandidateScore(candidate.examStats.averageScore)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Review
          </span>
          <p className="mt-1 font-medium text-slate-700">
            {candidate.examStats.pendingManualReviews > 0
              ? `${candidate.examStats.pendingManualReviews} pending`
              : "Clear"}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Status
          </span>
          <div className="mt-1">
            <CandidateStatusBadge status={candidate.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
