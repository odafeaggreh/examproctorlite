import { getAdminDb } from "@/lib/firebase/admin";
import type {
  ExamAttemptRecord,
  ExamAttemptStatus,
} from "@/lib/types/exam-management";
import { timestampToIso } from "@/lib/format/date-utils";

function normalizeAttemptStatus(value: unknown): ExamAttemptStatus {
  if (
    value === "not_started" ||
    value === "in_progress" ||
    value === "submitted" ||
    value === "pending_review" ||
    value === "finalized" ||
    value === "released"
  ) {
    return value;
  }

  return "not_started";
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function serializeStudentSnapshot(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const snapshot = value as Record<string, unknown>;

  return {
    name: typeof snapshot.name === "string" ? snapshot.name : undefined,
    email: typeof snapshot.email === "string" ? snapshot.email : undefined,
  };
}

function serializeExamAttemptRecord(
  id: string,
  data: Record<string, unknown>,
): ExamAttemptRecord {
  return {
    id,
    examId: String(data.examId ?? ""),
    studentUid: String(data.studentUid ?? ""),
    assignmentId:
      typeof data.assignmentId === "string" ? data.assignmentId : undefined,
    status: normalizeAttemptStatus(data.status),
    startedAt: timestampToIso(data.startedAt),
    submittedAt: timestampToIso(data.submittedAt),
    autoSubmittedAt: timestampToIso(data.autoSubmittedAt),
    timeLimitMinutes: Number(data.timeLimitMinutes ?? 0),
    autoScore: optionalNumber(data.autoScore),
    manualScore: optionalNumber(data.manualScore),
    score: optionalNumber(data.score),
    percentage: optionalNumber(data.percentage),
    requiresManualReview: Boolean(data.requiresManualReview),
    emailSent: Boolean(data.emailSent),
    examSnapshot:
      data.examSnapshot && typeof data.examSnapshot === "object"
        ? (data.examSnapshot as Record<string, unknown>)
        : undefined,
    studentSnapshot: serializeStudentSnapshot(data.studentSnapshot),
  };
}

export async function listExamAttemptRecords(examId: string) {
  const snapshot = await getAdminDb()
    .collection("attempts")
    .where("examId", "==", examId)
    .get();

  return snapshot.docs
    .map((document) =>
      serializeExamAttemptRecord(document.id, document.data()),
    )
    .sort((firstAttempt, secondAttempt) => {
      const firstDate =
        firstAttempt.submittedAt ?? firstAttempt.startedAt ?? "";
      const secondDate =
        secondAttempt.submittedAt ?? secondAttempt.startedAt ?? "";

      return secondDate.localeCompare(firstDate);
    });
}
