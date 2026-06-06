import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  CandidateExamHistoryStatus,
  CandidateRosterStatus,
  CandidateUserRecord,
  ExamCandidateRecord,
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
