import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, UserRound } from "lucide-react";

import { CandidateExamHistoryTable } from "@/components/admin/candidates/candidate-exam-history-table";
import { CandidateMetricCard } from "@/components/admin/candidates/candidate-metric-card";
import { CandidateProfileDetailsCard } from "@/components/admin/candidates/candidate-profile-details-card";
import { CandidateProfileHeader } from "@/components/admin/candidates/candidate-profile-header";
import { getAdminCandidateById } from "@/lib/dal/candidates";
import { getAdminExamList } from "@/lib/dal/exams";
import { formatCandidateScore } from "@/lib/format/candidates";

export default async function AdminCandidateProfilePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const [candidate, exams] = await Promise.all([
    getAdminCandidateById(candidateId),
    getAdminExamList(),
  ]);

  if (!candidate) {
    notFound();
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <CandidateProfileHeader candidate={candidate} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CandidateMetricCard
          icon={UserRound}
          label="Assigned exams"
          value={`${candidate.examStats.assigned}`}
          note={`${candidate.examStats.taken} started`}
        />
        <CandidateMetricCard
          icon={CheckCircle2}
          label="Completed"
          value={`${candidate.examStats.completed}`}
          note="Finished exam records"
        />
        <CandidateMetricCard
          icon={Clock}
          label="Average score"
          value={formatCandidateScore(candidate.examStats.averageScore)}
          note="Across completed exams"
        />
        <CandidateMetricCard
          icon={AlertTriangle}
          label="Manual review"
          value={`${candidate.examStats.pendingManualReviews}`}
          note="Pending written-answer reviews"
        />
      </div>

      <CandidateProfileDetailsCard candidate={candidate} />
      <CandidateExamHistoryTable candidate={candidate} fallbackExams={exams} />
    </div>
  );
}
