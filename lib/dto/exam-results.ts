import "server-only";

import type {
  ExamAttemptRecord,
  ExamAttemptStatus,
} from "@/lib/types/exam-management";

export interface ExamCandidateResultDTO {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ExamAttemptStatus;
  score: number | null;
  percentage: number | null;
  requiresManualReview: boolean;
  submittedAt: string | null;
  startedAt: string | null;
  emailSent: boolean;
}

export interface ExamResultSummaryDTO {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  averagePercentage: number | null;
  pendingManualReviews: number;
  passCount: number;
}

function hasCompletedAttempt(status: ExamAttemptStatus) {
  return (
    status === "submitted" ||
    status === "pending_review" ||
    status === "finalized" ||
    status === "released"
  );
}

function buildSummaryFromCandidateResults({
  candidates,
  passMark,
}: {
  candidates: ExamCandidateResultDTO[];
  passMark: number;
}): ExamResultSummaryDTO {
  const completedCandidates = candidates.filter((candidate) =>
    hasCompletedAttempt(candidate.status),
  );
  const scoredCandidates = completedCandidates.filter(
    (candidate) => typeof candidate.score === "number",
  );
  const percentageCandidates = completedCandidates.filter(
    (candidate) => typeof candidate.percentage === "number",
  );

  return {
    totalAttempts: candidates.length,
    completedAttempts: completedCandidates.length,
    averageScore:
      scoredCandidates.length > 0
        ? scoredCandidates.reduce(
            (total, candidate) => total + Number(candidate.score ?? 0),
            0,
          ) / scoredCandidates.length
        : null,
    averagePercentage:
      percentageCandidates.length > 0
        ? percentageCandidates.reduce(
            (total, candidate) => total + Number(candidate.percentage ?? 0),
            0,
          ) / percentageCandidates.length
        : null,
    pendingManualReviews: candidates.filter(
      (candidate) =>
        candidate.requiresManualReview || candidate.status === "pending_review",
    ).length,
    passCount: completedCandidates.filter(
      (candidate) => Number(candidate.percentage ?? -1) >= passMark,
    ).length,
  };
}

export function toExamCandidateResultDTO(
  attempt: ExamAttemptRecord,
): ExamCandidateResultDTO {
  return {
    id: attempt.id,
    candidateId: attempt.studentUid || attempt.id,
    candidateName: attempt.studentSnapshot?.name || "Unnamed candidate",
    candidateEmail:
      attempt.studentSnapshot?.email || attempt.studentUid || "No email",
    status: attempt.status,
    score: attempt.score ?? null,
    percentage: attempt.percentage ?? null,
    requiresManualReview: attempt.requiresManualReview,
    submittedAt: attempt.submittedAt,
    startedAt: attempt.startedAt,
    emailSent: attempt.emailSent,
  };
}

export function buildExamResultSummary({
  attempts,
  passMark,
}: {
  attempts: ExamAttemptRecord[];
  passMark: number;
}): ExamResultSummaryDTO {
  return buildSummaryFromCandidateResults({
    candidates: attempts.map(toExamCandidateResultDTO),
    passMark,
  });
}

export function buildExamResultSummaryFromCandidates({
  candidates,
  passMark,
}: {
  candidates: ExamCandidateResultDTO[];
  passMark: number;
}) {
  return buildSummaryFromCandidateResults({ candidates, passMark });
}
