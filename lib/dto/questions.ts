import "server-only";

import type {
  ExamQuestionRecord,
  QuestionBankRecord,
} from "@/lib/types/exam-management";

export interface QuestionBankItemDTO {
  id: string;
  sourceQuestionId?: string;
  title: string;
  required: boolean;
  type: QuestionBankRecord["type"];
  options: QuestionBankRecord["options"];
  points: number;
  correctAnswer?: string;
  feedback?: QuestionBankRecord["feedback"];
}

export function toQuestionBankItemDTO(
  question: QuestionBankRecord,
): QuestionBankItemDTO {
  return {
    id: question.id,
    sourceQuestionId: question.id,
    title: question.title,
    required: question.required,
    type: question.type,
    options: question.options,
    points: question.points,
    correctAnswer: question.correctAnswer,
    feedback: question.feedback,
  };
}

export function toExamQuestionItemDTO(
  question: ExamQuestionRecord,
): QuestionBankItemDTO {
  return {
    id: question.id,
    sourceQuestionId: question.sourceQuestionId,
    title: question.title,
    required: question.required,
    type: question.type,
    options: question.options,
    points: question.points,
    correctAnswer: question.correctAnswer,
    feedback: question.feedback,
  };
}
