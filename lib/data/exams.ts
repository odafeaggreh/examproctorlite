import { FieldValue, Timestamp, type WriteBatch } from "firebase-admin/firestore";
import { getPlatformDefaults } from "@/lib/config/platform-defaults";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  ExamQuestionRecord,
  ExamRecord,
  ExamStatus,
  GradingMode,
  QuestionFeedbackRecord,
  QuestionOptionRecord,
  QuestionType,
  ResultReleaseMode,
} from "@/lib/types/exam-management";
import { timestampToIso } from "../format/date-utils";

type ExamQuestionPayload = {
  sourceQuestionId?: string;
  title: string;
  required?: boolean;
  type: QuestionType;
  options?: QuestionOptionRecord[];
  points?: number;
  correctAnswer?: string;
  feedback?: QuestionFeedbackRecord;
};

export function serializeExamRecord(
  id: string,
  data: Record<string, unknown>,
): ExamRecord {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    instructions: String(data.instructions ?? ""),
    status: (data.status as ExamStatus) ?? "draft",
    timezone: String(data.timezone ?? "Africa/Lagos"),
    durationMinutes: Number(data.durationMinutes ?? 60),
    passMark: Number(data.passMark ?? 50),
    shuffleQuestions: Boolean(data.shuffleQuestions),
    shuffleOptions: Boolean(data.shuffleOptions),
    maxAccessCodeUses: Number(data.maxAccessCodeUses ?? 1),
    gradingMode: (data.gradingMode as GradingMode) ?? "manual_review_default",
    resultReleaseMode:
      (data.resultReleaseMode as ResultReleaseMode) ?? "manual_release",
    hasManualReviewQuestions: Boolean(data.hasManualReviewQuestions),
    questionCount: Number(data.questionCount ?? 0),
    totalPoints: Number(data.totalPoints ?? 0),
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    publishedAt: timestampToIso(data.publishedAt),
    startAt: timestampToIso(data.startAt) ?? "",
    endAt: timestampToIso(data.endAt) ?? "",
  };
}

export async function listExams() {
  const snapshot = await getAdminDb()
    .collection("exams")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((document) =>
    serializeExamRecord(document.id, document.data()),
  );
}

export async function getExamRecord(examId: string) {
  const snapshot = await getAdminDb().collection("exams").doc(examId).get();

  if (!snapshot.exists) {
    return null;
  }

  return serializeExamRecord(snapshot.id, snapshot.data() ?? {});
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

export function serializeExamQuestionRecord(
  id: string,
  data: Record<string, unknown>,
): ExamQuestionRecord {
  return {
    id,
    examId: String(data.examId ?? ""),
    sourceQuestionId:
      typeof data.sourceQuestionId === "string"
        ? data.sourceQuestionId
        : undefined,
    title: String(data.title ?? ""),
    required: Boolean(data.required),
    type: resolveQuestionType(data.type),
    options: serializeQuestionOptions(data.options),
    points: Number(data.points ?? 0),
    correctAnswer:
      typeof data.correctAnswer === "string" ? data.correctAnswer : undefined,
    feedback: serializeQuestionFeedback(data.feedback),
    order: Number(data.order ?? 0),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function listExamQuestionRecords(examId: string) {
  const snapshot = await getAdminDb()
    .collection("exams")
    .doc(examId)
    .collection("questions")
    .orderBy("order", "asc")
    .get();

  return snapshot.docs.map((document) =>
    serializeExamQuestionRecord(document.id, document.data()),
  );
}

function hasManualReviewQuestions(questions: ExamQuestionPayload[]) {
  return questions.some(
    (question) =>
      question.type === "short_text" || question.type === "paragraph",
  );
}

function getTotalPoints(questions: ExamQuestionPayload[]) {
  return questions.reduce((total, question) => total + (question.points ?? 0), 0);
}

function buildExamQuestionData({
  examId,
  question,
  order,
}: {
  examId: string;
  question: ExamQuestionPayload;
  order: number;
}) {
  return {
    examId,
    sourceQuestionId: question.sourceQuestionId ?? null,
    title: question.title.trim(),
    required: question.required ?? true,
    type: question.type,
    options: question.options ?? [],
    points: question.points ?? 1,
    correctAnswer: question.correctAnswer?.trim() || "",
    feedback: question.feedback ?? {},
    order,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function examQuestionDocumentId(order: number) {
  return `question_${String(order).padStart(4, "0")}`;
}

function writeExamQuestionsToBatch({
  batch,
  examId,
  questions,
}: {
  batch: WriteBatch;
  examId: string;
  questions: ExamQuestionPayload[];
}) {
  const questionsCollection = getAdminDb()
    .collection("exams")
    .doc(examId)
    .collection("questions");

  questions.forEach((question, index) => {
    const order = index + 1;
    const reference = questionsCollection.doc(examQuestionDocumentId(order));

    batch.set(reference, {
      ...buildExamQuestionData({ examId, question, order }),
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function createExamRecord({
  createdBy,
  payload,
}: {
  createdBy: string;
  payload: {
    title: string;
    description?: string;
    instructions?: string;
    durationMinutes?: number;
    timezone?: string;
    maxAccessCodeUses?: number;
    gradingMode?: GradingMode;
    resultReleaseMode?: ResultReleaseMode;
    startAt: string;
    endAt: string;
    status?: ExamStatus;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    passMark?: number;
    questions: ExamQuestionPayload[];
  };
}) {
  const defaults = await getPlatformDefaults();
  const db = getAdminDb();
  const documentReference = db.collection("exams").doc();
  const resultReleaseMode =
    payload.resultReleaseMode ?? defaults.defaultResultReleaseMode;
  const hasManualReview = hasManualReviewQuestions(payload.questions);

  if (hasManualReview && resultReleaseMode === "auto_release_on_submission") {
    throw new Error(
      "This exam contains manual-review questions and cannot auto-release results.",
    );
  }

  const examData = {
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    instructions: payload.instructions?.trim() ?? "",
    status: payload.status ?? ("draft" as ExamStatus),
    timezone: payload.timezone?.trim() || defaults.defaultTimezone,
    durationMinutes:
      payload.durationMinutes && payload.durationMinutes > 0
        ? payload.durationMinutes
        : defaults.defaultExamDurationMinutes,
    passMark: payload.passMark ?? 50,
    shuffleQuestions:
      payload.shuffleQuestions ?? defaults.defaultShuffleQuestions,
    shuffleOptions: payload.shuffleOptions ?? defaults.defaultShuffleOptions,
    maxAccessCodeUses:
      payload.maxAccessCodeUses && payload.maxAccessCodeUses > 0
        ? payload.maxAccessCodeUses
        : defaults.defaultAccessCodeMaxUses,
    gradingMode: payload.gradingMode ?? "manual_review_default",
    resultReleaseMode,
    hasManualReviewQuestions: hasManualReview,
    questionCount: payload.questions.length,
    totalPoints: getTotalPoints(payload.questions),
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt:
      payload.status === "published" ? FieldValue.serverTimestamp() : null,
    startAt: Timestamp.fromDate(new Date(payload.startAt)),
    endAt: Timestamp.fromDate(new Date(payload.endAt)),
  };

  const batch = db.batch();
  batch.set(documentReference, examData);
  writeExamQuestionsToBatch({
    batch,
    examId: documentReference.id,
    questions: payload.questions,
  });

  await batch.commit();
  const snapshot = await documentReference.get();
  return serializeExamRecord(snapshot.id, snapshot.data() ?? {});
}

export async function updateExamRecord({
  examId,
  payload,
}: {
  examId: string;
  payload: {
    title: string;
    description?: string;
    instructions?: string;
    durationMinutes?: number;
    timezone?: string;
    maxAccessCodeUses?: number;
    gradingMode?: GradingMode;
    resultReleaseMode?: ResultReleaseMode;
    startAt: string;
    endAt: string;
    status?: ExamStatus;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    passMark?: number;
    questions: ExamQuestionPayload[];
  };
}) {
  const db = getAdminDb();
  const documentReference = db.collection("exams").doc(examId);
  const snapshot = await documentReference.get();

  if (!snapshot.exists) {
    throw new Error("Exam not found");
  }

  const currentExam = serializeExamRecord(snapshot.id, snapshot.data() ?? {});

  const resultReleaseMode =
    payload.resultReleaseMode ?? currentExam.resultReleaseMode;
  const hasManualReview = hasManualReviewQuestions(payload.questions);

  if (hasManualReview && resultReleaseMode === "auto_release_on_submission") {
    throw new Error(
      "This exam contains manual-review questions and cannot auto-release results.",
    );
  }

  const currentQuestions = await documentReference.collection("questions").get();
  const batch = db.batch();

  batch.set(
    documentReference,
    {
      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",
      instructions: payload.instructions?.trim() ?? "",
      durationMinutes: payload.durationMinutes ?? currentExam.durationMinutes,
      timezone: payload.timezone?.trim() || currentExam.timezone,
      status: payload.status ?? currentExam.status,
      maxAccessCodeUses:
        payload.maxAccessCodeUses ?? currentExam.maxAccessCodeUses,
      passMark: payload.passMark ?? currentExam.passMark,
      shuffleQuestions:
        payload.shuffleQuestions ?? currentExam.shuffleQuestions,
      shuffleOptions: payload.shuffleOptions ?? currentExam.shuffleOptions,
      gradingMode: payload.gradingMode ?? currentExam.gradingMode,
      resultReleaseMode,
      hasManualReviewQuestions: hasManualReview,
      questionCount: payload.questions.length,
      totalPoints: getTotalPoints(payload.questions),
      startAt: Timestamp.fromDate(new Date(payload.startAt)),
      endAt: Timestamp.fromDate(new Date(payload.endAt)),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  currentQuestions.docs.forEach((document) => {
    batch.delete(document.ref);
  });
  writeExamQuestionsToBatch({ batch, examId, questions: payload.questions });

  await batch.commit();

  const updatedSnapshot = await documentReference.get();
  return serializeExamRecord(updatedSnapshot.id, updatedSnapshot.data() ?? {});
}

async function hasActiveExamAccessCode(examId: string) {
  const snapshot = await getAdminDb()
    .collection("examAccessCodes")
    .doc(examId)
    .get();

  return snapshot.exists && snapshot.data()?.status === "active";
}

export async function updateExamPublicationStatus({
  examId,
  status,
}: {
  examId: string;
  status: ExamStatus;
}) {
  const db = getAdminDb();
  const documentReference = db.collection("exams").doc(examId);
  const snapshot = await documentReference.get();

  if (!snapshot.exists) {
    throw new Error("Exam not found");
  }

  const exam = serializeExamRecord(snapshot.id, snapshot.data() ?? {});

  if (status === "published") {
    if (!exam.title.trim()) {
      throw new Error("Add an exam title before publishing.");
    }

    if (!exam.startAt || !exam.endAt) {
      throw new Error("Set the exam window before publishing.");
    }

    if (new Date(exam.endAt).getTime() <= new Date(exam.startAt).getTime()) {
      throw new Error("Set an exam end time after the start time.");
    }

    if (exam.questionCount < 1) {
      throw new Error("Add at least one question before publishing.");
    }

    if (!(await hasActiveExamAccessCode(examId))) {
      throw new Error("Create an active access code before publishing.");
    }

    if (
      exam.hasManualReviewQuestions &&
      exam.resultReleaseMode === "auto_release_on_submission"
    ) {
      throw new Error(
        "This exam contains manual-review questions and cannot auto-release results.",
      );
    }
  }

  await documentReference.set(
    {
      status,
      updatedAt: FieldValue.serverTimestamp(),
      ...(status === "published" && !exam.publishedAt
        ? { publishedAt: FieldValue.serverTimestamp() }
        : {}),
      ...(status !== "published" ? { publishedAt: null } : {}),
    },
    { merge: true },
  );

  const updatedSnapshot = await documentReference.get();
  return serializeExamRecord(updatedSnapshot.id, updatedSnapshot.data() ?? {});
}
