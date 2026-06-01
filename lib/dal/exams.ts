import "server-only";

import {
  getExamRecord,
  listExamQuestionRecords,
  listExams,
} from "@/lib/data/exams";
import { toExamListItemDTO } from "@/lib/dto/exams";
import { toExamQuestionItemDTO } from "@/lib/dto/questions";

export async function getAdminExamList() {
  const exams = await listExams();
  return exams.map(toExamListItemDTO);
}

export async function getAdminExamById(examId: string) {
  const exam = await getExamRecord(examId);

  if (!exam) {
    return null;
  }

  return toExamListItemDTO(exam);
}

export async function getAdminExamQuestions(examId: string) {
  const questions = await listExamQuestionRecords(examId);
  return questions.map(toExamQuestionItemDTO);
}
