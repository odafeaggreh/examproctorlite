import { notFound } from "next/navigation";

import { CandidateExamResultWorkspace } from "@/components/admin/candidates/candidate-exam-result-workspace";
import { getDummyCandidateExamResult } from "@/constants/admin-exam-overview";
import { getAdminCandidateById } from "@/lib/dal/candidates";
import { getAdminExamById } from "@/lib/dal/exams";

export default async function AdminCandidateExamResultPage({
  params,
}: {
  params: Promise<{ candidateId: string; examId: string }>;
}) {
  const { candidateId, examId } = await params;
  const [exam, candidate] = await Promise.all([
    getAdminExamById(examId),
    getAdminCandidateById(candidateId),
  ]);

  const candidateResult = getDummyCandidateExamResult({
    candidateEmail: candidate?.email,
    candidateId,
    candidateName: candidate?.name,
    examId,
  });

  if (!exam || !candidateResult) {
    notFound();
  }

  return (
    <CandidateExamResultWorkspace
      exam={exam}
      candidate={candidateResult.candidate}
      initialAnswers={candidateResult.answers}
    />
  );
}
