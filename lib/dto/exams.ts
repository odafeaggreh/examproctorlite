import "server-only";

import type { ExamRecord } from "@/lib/types/exam-management";

export interface ExamListItemDTO {
  id: string;
  title: string;
  description: string;
  instructions: string;
  status: ExamRecord["status"];
  durationMinutes: number;
  timezone: string;
  startAt: string;
  endAt: string;
  passMark: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  gradingMode: ExamRecord["gradingMode"];
  resultReleaseMode: ExamRecord["resultReleaseMode"];
  maxAccessCodeUses: number;
  hasManualReviewQuestions: boolean;
  questionCount: number;
  totalPoints: number;
}

export function toExamListItemDTO(exam: ExamRecord): ExamListItemDTO {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    instructions: exam.instructions,
    status: exam.status,
    durationMinutes: exam.durationMinutes,
    timezone: exam.timezone,
    startAt: exam.startAt,
    endAt: exam.endAt,
    passMark: exam.passMark,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    gradingMode: exam.gradingMode,
    resultReleaseMode: exam.resultReleaseMode,
    maxAccessCodeUses: exam.maxAccessCodeUses,
    hasManualReviewQuestions: exam.hasManualReviewQuestions,
    questionCount: exam.questionCount,
    totalPoints: exam.totalPoints,
  };
}
