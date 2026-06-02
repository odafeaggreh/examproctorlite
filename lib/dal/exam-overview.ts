import "server-only";

import {
  getDummyExamCandidateResults,
  USE_DUMMY_EXAM_RESULT_DATA,
} from "@/constants/admin-exam-overview";
import { getExamAssignmentSummary } from "@/lib/data/exam-setup";
import { listExamAttemptRecords } from "@/lib/data/exam-results";
import { getAdminExamById } from "@/lib/dal/exams";
import {
  buildExamResultSummary,
  buildExamResultSummaryFromCandidates,
  toExamCandidateResultDTO,
} from "@/lib/dto/exam-results";

export async function getAdminExamOverview(examId: string) {
  const [exam, assignmentSummary, attempts] = await Promise.all([
    getAdminExamById(examId),
    getExamAssignmentSummary(examId),
    listExamAttemptRecords(examId),
  ]);

  if (!exam) {
    return null;
  }

  const shouldUseDummyResults =
    USE_DUMMY_EXAM_RESULT_DATA && attempts.length === 0;
  const candidates = shouldUseDummyResults
    ? getDummyExamCandidateResults(examId)
    : attempts.map(toExamCandidateResultDTO);

  return {
    exam,
    assignmentSummary,
    resultSummary: shouldUseDummyResults
      ? buildExamResultSummaryFromCandidates({
          candidates,
          passMark: exam.passMark,
        })
      : buildExamResultSummary({
          attempts,
          passMark: exam.passMark,
        }),
    candidates,
    isUsingDummyResults: shouldUseDummyResults,
  };
}
