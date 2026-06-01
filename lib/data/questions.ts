import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  QuestionBankRecord,
  QuestionFeedbackRecord,
  QuestionOptionRecord,
  QuestionType,
} from "@/lib/types/exam-management";
import { timestampToIso } from "../format/date-utils";

function serializeQuestionOptions(value: unknown): QuestionOptionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((option) => {
    const record =
      typeof option === "object" && option !== null
        ? (option as Record<string, unknown>)
        : {};

    return {
      value: String(record.value ?? ""),
      isCorrect: Boolean(record.isCorrect),
    };
  });
}

function serializeQuestionFeedback(
  value: unknown,
): QuestionFeedbackRecord | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const whenWrong =
    typeof record.whenWrong === "string" ? record.whenWrong : undefined;

  return whenWrong ? { whenWrong } : undefined;
}

function resolveQuestionType(value: unknown): QuestionType {
  if (
    value === "multiple_choice" ||
    value === "checkboxes" ||
    value === "dropdown" ||
    value === "short_text" ||
    value === "paragraph"
  ) {
    return value;
  }

  return "multiple_choice";
}

export function serializeQuestionBankRecord(
  id: string,
  data: Record<string, unknown>,
): QuestionBankRecord {
  const options = serializeQuestionOptions(data.options);
  const feedback = serializeQuestionFeedback(data.feedback);

  return {
    id,
    title: String(data.title ?? ""),
    required: Boolean(data.required),
    type: resolveQuestionType(data.type),
    options,
    points: Number(data.points ?? 0),
    correctAnswer:
      typeof data.correctAnswer === "string" ? data.correctAnswer : undefined,
    feedback,
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function listQuestionBankRecords() {
  const snapshot = await getAdminDb()
    .collection("questions")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((document) =>
    serializeQuestionBankRecord(document.id, document.data()),
  );
}

export async function createQuestionBankRecord({
  createdBy,
  payload,
}: {
  createdBy: string;
  payload: {
    title: string;
    required?: boolean;
    type: QuestionType;
    options?: QuestionOptionRecord[];
    points?: number;
    correctAnswer?: string;
    feedback?: QuestionFeedbackRecord;
  };
}) {
  const documentReference = getAdminDb().collection("questions").doc();
  const options = payload.options ?? [];

  await documentReference.set({
    title: payload.title.trim(),
    required: payload.required ?? true,
    type: payload.type,
    options,
    points: payload.points ?? 1,
    correctAnswer: payload.correctAnswer?.trim() || "",
    feedback: payload.feedback ?? {},
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snapshot = await documentReference.get();
  return serializeQuestionBankRecord(snapshot.id, snapshot.data() ?? {});
}

export async function updateQuestionBankRecord({
  questionId,
  payload,
}: {
  questionId: string;
  payload: {
    title: string;
    required?: boolean;
    type: QuestionType;
    options?: QuestionOptionRecord[];
    points?: number;
    correctAnswer?: string;
    feedback?: QuestionFeedbackRecord;
  };
}) {
  const documentReference = getAdminDb()
    .collection("questions")
    .doc(questionId);
  const snapshot = await documentReference.get();

  if (!snapshot.exists) {
    return null;
  }

  await documentReference.update({
    title: payload.title.trim(),
    required: payload.required ?? true,
    type: payload.type,
    options: payload.options ?? [],
    points: payload.points ?? 1,
    correctAnswer: payload.correctAnswer?.trim() || "",
    feedback: payload.feedback ?? {},
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedSnapshot = await documentReference.get();
  return serializeQuestionBankRecord(
    updatedSnapshot.id,
    updatedSnapshot.data() ?? {},
  );
}
