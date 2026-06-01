import "server-only";

import {
  getExamAssignmentSummary,
  listStudentGroups,
} from "@/lib/data/exam-setup";

export async function getAdminExamStepTwoData(examId: string) {
  const [groups, summary] = await Promise.all([
    listStudentGroups(),
    getExamAssignmentSummary(examId),
  ]);

  return {
    groups,
    summary,
  };
}
