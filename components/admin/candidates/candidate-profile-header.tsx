import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import type { AdminCandidate } from "@/lib/types/exam-management";
import { CandidateAvatar } from "@/components/admin/candidates/candidate-avatar";
import { CandidateStatusBadge } from "@/components/admin/candidates/candidate-badges";
import { Button } from "@/components/ui/button";

export function CandidateProfileHeader({
  candidate,
}: {
  candidate: AdminCandidate;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link href="/admin/candidates">
            <ArrowLeft className="size-4" />
            Candidates
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <CandidateAvatar candidate={candidate} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {candidate.name}
              </h1>
              <CandidateStatusBadge status={candidate.status} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Mail className="size-4" />
              {candidate.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
