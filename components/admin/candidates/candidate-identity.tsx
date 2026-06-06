import Link from "next/link";

import type { AdminCandidate } from "@/lib/types/exam-management";
import { CandidateAvatar } from "@/components/admin/candidates/candidate-avatar";
import { getAdminCandidateHref } from "@/lib/format/candidates";
import { formatDateTime } from "@/lib/format/date";

export function CandidateIdentity({
  candidate,
}: {
  candidate: AdminCandidate;
}) {
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <CandidateAvatar candidate={candidate} />
      <div className="min-w-0">
        <Link
          className="block truncate font-semibold text-slate-900 transition-colors hover:text-blue-600"
          href={getAdminCandidateHref(candidate.uid)}
        >
          {candidate.name}
        </Link>
        <p className="mt-1 text-xs text-slate-500">
          Joined {formatDateTime(candidate.createdAt) ?? "Unknown"}
        </p>
      </div>
    </div>
  );
}
