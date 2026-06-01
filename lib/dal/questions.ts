import "server-only";

import { listQuestionBankRecords } from "@/lib/data/questions";
import { toQuestionBankItemDTO } from "@/lib/dto/questions";

export async function getAdminQuestionBank() {
  const questions = await listQuestionBankRecords();
  return questions.map(toQuestionBankItemDTO);
}
