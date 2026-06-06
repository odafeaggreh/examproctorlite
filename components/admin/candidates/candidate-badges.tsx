import { Badge } from "@/components/ui/badge";
import type {
  CandidateExamHistoryStatus,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import { formatCandidateStatus } from "@/lib/format/candidates";

export function rosterStatusVariant(status: CandidateRosterStatus) {
  return status === "active" ? ("success" as const) : ("outline" as const);
}

export function examHistoryStatusVariant(status: CandidateExamHistoryStatus) {
  if (status === "released" || status === "finalized" || status === "graded") {
    return "success" as const;
  }

  if (status === "pending_review" || status === "submitted") {
    return "warning" as const;
  }

  return "outline" as const;
}

export function CandidateStatusBadge({
  status,
}: {
  status: CandidateRosterStatus;
}) {
  return (
    <Badge
      variant={rosterStatusVariant(status)}
      className="min-w-[72px] justify-center capitalize"
    >
      {status}
    </Badge>
  );
}

export function CandidateExamStatusBadge({
  status,
}: {
  status: CandidateExamHistoryStatus;
}) {
  return (
    <Badge variant={examHistoryStatusVariant(status)}>
      {formatCandidateStatus(status)}
    </Badge>
  );
}
