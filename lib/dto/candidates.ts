import "server-only";

import type {
  AdminCandidate,
  AdminCandidateExamHistoryItem,
  AdminCandidateExamStats,
  CandidateExamHistoryStatus,
  CandidateUserRecord,
  ExamCandidateRecord,
  ExamRecord,
} from "@/lib/types/exam-management";

function isCompletedStatus(status: CandidateExamHistoryStatus) {
  return (
    status === "submitted" ||
    status === "pending_review" ||
    status === "graded" ||
    status === "finalized" ||
    status === "released"
  );
}

function isTakenStatus(status: CandidateExamHistoryStatus) {
  return status !== "not_started";
}

function latestDate(values: Array<string | null>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function buildCandidateStats(
  examCandidates: ExamCandidateRecord[],
): AdminCandidateExamStats {
  const completedCandidates = examCandidates.filter((candidate) =>
    isCompletedStatus(candidate.status),
  );
  const scoredCandidates = completedCandidates.filter(
    (candidate) => candidate.percentage !== null,
  );

  return {
    assigned: examCandidates.length,
    taken: examCandidates.filter((candidate) =>
      isTakenStatus(candidate.status),
    ).length,
    completed: completedCandidates.length,
    averageScore:
      scoredCandidates.length > 0
        ? scoredCandidates.reduce(
            (total, candidate) => total + Number(candidate.percentage ?? 0),
            0,
          ) / scoredCandidates.length
        : null,
    pendingManualReviews: examCandidates.reduce(
      (total, candidate) =>
        total +
        (candidate.pendingManualReviewCount > 0 ||
        candidate.requiresManualReview ||
        candidate.status === "pending_review"
          ? Math.max(candidate.pendingManualReviewCount, 1)
          : 0),
      0,
    ),
    lastActivityAt: latestDate(
      examCandidates.flatMap((candidate) => [
        candidate.releasedAt,
        candidate.gradedAt,
        candidate.submittedAt,
        candidate.startedAt,
        candidate.updatedAt,
      ]),
    ),
  };
}

function toExamHistoryItem({
  examCandidate,
  examTitleById,
}: {
  examCandidate: ExamCandidateRecord;
  examTitleById: Map<string, string>;
}): AdminCandidateExamHistoryItem {
  return {
    examId: examCandidate.examId,
    examTitle:
      examTitleById.get(examCandidate.examId) || "Untitled exam",
    status: examCandidate.status,
    score: examCandidate.score,
    percentage: examCandidate.percentage,
    submittedAt: examCandidate.submittedAt,
    requiresManualReview:
      examCandidate.requiresManualReview ||
      examCandidate.pendingManualReviewCount > 0,
  };
}

export function toAdminCandidateDTO({
  examCandidates,
  exams,
  user,
}: {
  user: CandidateUserRecord;
  examCandidates: ExamCandidateRecord[];
  exams: ExamRecord[];
}): AdminCandidate {
  const examTitleById = new Map(exams.map((exam) => [exam.id, exam.title]));
  const sortedExamCandidates = [...examCandidates].sort((first, second) => {
    const firstDate =
      first.submittedAt ?? first.startedAt ?? first.updatedAt ?? "";
    const secondDate =
      second.submittedAt ?? second.startedAt ?? second.updatedAt ?? "";

    return secondDate.localeCompare(firstDate);
  });

  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    examStats: buildCandidateStats(sortedExamCandidates),
    examHistory: sortedExamCandidates.map((examCandidate) =>
      toExamHistoryItem({ examCandidate, examTitleById }),
    ),
  };
}
