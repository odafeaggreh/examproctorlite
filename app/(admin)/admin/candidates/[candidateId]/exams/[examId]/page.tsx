import { notFound } from "next/navigation";

import { CandidateExamResultWorkspace } from "@/components/admin/candidates/candidate-exam-result-workspace";
import { getAdminCandidateExamResult } from "@/lib/dal/candidates";
import { getAdminExamById } from "@/lib/dal/exams";

export default async function AdminCandidateExamResultPage({
  params,
}: {
  params: Promise<{ candidateId: string; examId: string }>;
}) {
  const { candidateId, examId } = await params;
  const [exam, candidateResult] = await Promise.all([
    getAdminExamById(examId),
    getAdminCandidateExamResult({ candidateId, examId }),
  ]);

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
