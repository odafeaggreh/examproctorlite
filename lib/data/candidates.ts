import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  CandidateAnswerReviewStatus,
  CandidateExamHistoryStatus,
  CandidateRosterStatus,
  ExamCandidateAnswerRecord,
  CandidateUserRecord,
  ExamCandidateRecord,
  QuestionOptionRecord,
  QuestionType,
  UserRole,
} from "@/lib/types/exam-management";
import { timestampToIso } from "@/lib/format/date-utils";

function dateToIso(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value instanceof Date || value instanceof Timestamp) {
    return timestampToIso(value);
  }

  return null;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeRole(value: unknown): UserRole {
  if (value === "superAdmin" || value === "admin") {
    return value;
  }

  return "student";
}

function normalizeCandidateStatus(value: unknown): CandidateRosterStatus {
  return value === "inactive" ? "inactive" : "active";
}

function normalizeExamCandidateStatus(
  value: unknown,
): CandidateExamHistoryStatus {
  if (
    value === "not_started" ||
    value === "in_progress" ||
    value === "submitted" ||
    value === "pending_review" ||
    value === "graded" ||
    value === "finalized" ||
    value === "released"
  ) {
    return value;
  }

  return "not_started";
}

function normalizeQuestionType(value: unknown): QuestionType {
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

function normalizeAnswerReviewStatus(
  value: unknown,
): CandidateAnswerReviewStatus {
  if (
    value === "auto_graded" ||
    value === "pending_review" ||
    value === "reviewed"
  ) {
    return value;
  }

  return "pending_review";
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

function serializeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => String(item)).filter(Boolean);
}

function serializeAnswerValue(value: unknown): string | string[] {
  const arrayValue = serializeStringArray(value);

  if (arrayValue) {
    return arrayValue;
  }

  return String(value ?? "");
}

function serializeOptionalAnswerValue(
  value: unknown,
): string | string[] | undefined {
  const arrayValue = serializeStringArray(value);

  if (arrayValue) {
    return arrayValue;
  }

  return optionalString(value);
}

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function serializeCandidateUserRecord(
  id: string,
  data: Record<string, unknown>,
): CandidateUserRecord {
  return {
    uid: String(data.uid ?? id),
    name:
      String(data.name ?? data.displayName ?? "").trim() ||
      "Unnamed candidate",
    email: String(data.email ?? "").trim() || "No email",
    photoURL:
      typeof data.photoURL === "string" && data.photoURL.trim()
        ? data.photoURL
        : undefined,
    role: normalizeRole(data.role),
    status: normalizeCandidateStatus(data.status),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
  };
}

function serializeExamCandidateRecord({
  data,
  examId,
  id,
}: {
  data: Record<string, unknown>;
  examId: string;
  id: string;
}): ExamCandidateRecord {
  const pendingManualReviewCount = optionalNumber(
    data.pendingManualReviewCount,
  );

  return {
    id,
    examId: String(data.examId ?? examId),
    candidateId: String(data.candidateId ?? id),
    candidateName: String(data.candidateName ?? data.studentName ?? ""),
    candidateEmail: String(data.candidateEmail ?? data.studentEmail ?? ""),
    status: normalizeExamCandidateStatus(data.status),
    score: optionalNumber(data.score),
    percentage: optionalNumber(data.percentage),
    totalPoints: optionalNumber(data.totalPoints),
    passed: typeof data.passed === "boolean" ? data.passed : null,
    requiresManualReview: Boolean(data.requiresManualReview),
    pendingManualReviewCount: Number(pendingManualReviewCount ?? 0),
    startedAt: dateToIso(data.startedAt),
    submittedAt: dateToIso(data.submittedAt),
    gradedAt: dateToIso(data.gradedAt),
    releasedAt: dateToIso(data.releasedAt),
    resultEmailSent: Boolean(data.resultEmailSent ?? data.emailSent),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
  };
}

function serializeExamCandidateAnswerRecord({
  candidateId,
  data,
  examCandidateId,
  examId,
  id,
}: {
  candidateId: string;
  data: Record<string, unknown>;
  examCandidateId: string;
  examId: string;
  id: string;
}): ExamCandidateAnswerRecord {
  const questionSnapshot = getRecord(data.questionSnapshot);
  const response = serializeAnswerValue(
    data.response ?? data.answer ?? data.answers ?? data.value,
  );
  const correctAnswer = serializeOptionalAnswerValue(
    data.correctAnswer ??
      data.correctAnswers ??
      questionSnapshot.correctAnswer ??
      questionSnapshot.correctAnswers,
  );
  const questionOptions = serializeQuestionOptions(
    data.questionOptions ?? data.options ?? questionSnapshot.options,
  );
  const points = optionalNumber(data.points ?? questionSnapshot.points) ?? 0;
  const autoPoints = optionalNumber(data.autoPoints);
  const manualPoints = optionalNumber(data.manualPoints);
  const finalPoints = optionalNumber(data.finalPoints ?? data.score);

  return {
    id,
    examId: String(data.examId ?? examId),
    candidateId: String(data.candidateId ?? candidateId),
    examCandidateId: String(data.examCandidateId ?? examCandidateId),
    examQuestionId: String(data.examQuestionId ?? data.questionId ?? id),
    sourceQuestionId: optionalString(
      data.sourceQuestionId ?? questionSnapshot.sourceQuestionId,
    ),
    order: Number(data.order ?? questionSnapshot.order ?? 0),
    questionType: normalizeQuestionType(
      data.questionType ?? data.type ?? questionSnapshot.type,
    ),
    questionTitle:
      String(
        data.questionTitle ??
          data.title ??
          data.prompt ??
          questionSnapshot.title ??
          questionSnapshot.prompt ??
          "",
      ).trim() || "Untitled question",
    questionOptions,
    response,
    correctAnswer,
    points,
    autoPoints,
    manualPoints,
    finalPoints: finalPoints ?? manualPoints ?? autoPoints ?? null,
    isCorrect:
      typeof data.isCorrect === "boolean" ? data.isCorrect : null,
    reviewStatus: normalizeAnswerReviewStatus(data.reviewStatus),
    reviewedBy: optionalString(data.reviewedBy),
    reviewedAt: dateToIso(data.reviewedAt),
    feedback: optionalString(data.feedback),
    submittedAt: dateToIso(data.submittedAt),
    updatedAt: dateToIso(data.updatedAt),
  };
}

export async function listCandidateUserRecords() {
  const snapshot = await getAdminDb()
    .collection("users")
    .where("role", "==", "student")
    .get();

  return snapshot.docs.map((document) =>
    serializeCandidateUserRecord(document.id, document.data()),
  );
}

export async function getCandidateUserRecord(candidateId: string) {
  const snapshot = await getAdminDb().collection("users").doc(candidateId).get();

  if (!snapshot.exists) {
    return null;
  }

  const user = serializeCandidateUserRecord(
    snapshot.id,
    snapshot.data() ?? {},
  );

  return user.role === "student" ? user : null;
}

export async function updateCandidateUserStatus({
  actorUid,
  candidateId,
  status,
}: {
  actorUid: string;
  candidateId: string;
  status: CandidateRosterStatus;
}) {
  const db = getAdminDb();
  const userReference = db.collection("users").doc(candidateId);
  const userSnapshot = await userReference.get();

  if (!userSnapshot.exists) {
    throw new Error("Candidate not found");
  }

  const user = serializeCandidateUserRecord(
    userSnapshot.id,
    userSnapshot.data() ?? {},
  );

  if (user.role !== "student") {
    throw new Error("Only student accounts can be managed here.");
  }

  const updatedAt = new Date().toISOString();

  await userReference.set(
    {
      status,
      updatedAt,
    },
    { merge: true },
  );

  await db.collection("auditLogs").add({
    actorUid,
    action: "candidate.status.updated",
    entityType: "user",
    entityId: candidateId,
    metadata: { status },
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    ...user,
    status,
    updatedAt,
  };
}

export async function listAllExamCandidateRecords() {
  const snapshot = await getAdminDb().collectionGroup("candidates").get();

  return snapshot.docs.map((document) =>
    serializeExamCandidateRecord({
      id: document.id,
      examId: document.ref.parent.parent?.id ?? "",
      data: document.data(),
    }),
  );
}

export async function getExamCandidateRecord({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  const candidatesCollection = getAdminDb()
    .collection("exams")
    .doc(examId)
    .collection("candidates");
  const directSnapshot = await candidatesCollection.doc(candidateId).get();

  if (directSnapshot.exists) {
    return serializeExamCandidateRecord({
      id: directSnapshot.id,
      examId,
      data: directSnapshot.data() ?? {},
    });
  }

  const candidateSnapshot = await candidatesCollection
    .where("candidateId", "==", candidateId)
    .limit(1)
    .get();
  const candidateDocument = candidateSnapshot.docs[0];

  if (!candidateDocument) {
    return null;
  }

  return serializeExamCandidateRecord({
    id: candidateDocument.id,
    examId,
    data: candidateDocument.data(),
  });
}

export async function listExamCandidateAnswerRecords({
  candidate,
}: {
  candidate: ExamCandidateRecord;
}) {
  const db = getAdminDb();
  const candidateAnswersSnapshot = await db
    .collection("exams")
    .doc(candidate.examId)
    .collection("candidates")
    .doc(candidate.id)
    .collection("answers")
    .get();

  const answerDocuments = candidateAnswersSnapshot.empty
    ? (
        await db
          .collection("exams")
          .doc(candidate.examId)
          .collection("answers")
          .where("candidateId", "==", candidate.candidateId)
          .get()
      ).docs
    : candidateAnswersSnapshot.docs;

  return answerDocuments
    .map((document) =>
      serializeExamCandidateAnswerRecord({
        id: document.id,
        candidateId: candidate.candidateId,
        examCandidateId: candidate.id,
        examId: candidate.examId,
        data: document.data(),
      }),
    )
    .sort((first, second) => first.order - second.order);
}

export async function listExamCandidateRecordsForCandidate(
  candidateId: string,
) {
  const snapshot = await getAdminDb()
    .collectionGroup("candidates")
    .where("candidateId", "==", candidateId)
    .get();

  const records = snapshot.docs.map((document) =>
    serializeExamCandidateRecord({
      id: document.id,
      examId: document.ref.parent.parent?.id ?? "",
      data: document.data(),
    }),
  );

  if (records.length > 0) {
    return records;
  }

  const allRecords = await listAllExamCandidateRecords();
  return allRecords.filter(
    (record) => record.candidateId === candidateId || record.id === candidateId,
  );
}
