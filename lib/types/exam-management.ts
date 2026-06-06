export type UserRole = "student" | "admin" | "superAdmin";
export type StudentStatus = "active" | "inactive";
export type CandidateRosterStatus = StudentStatus;
export type CandidateExamHistoryStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "pending_review"
  | "graded"
  | "finalized"
  | "released";
export type AssignmentType = "csv_import" | "group" | "access_code";
export type AssignmentStatus = "assigned" | "redeemed" | "revoked";
export type AccessCodeStatus = "active" | "disabled" | "expired";
export type QuestionType =
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "short_text"
  | "paragraph";

export type ExamStatus = "draft" | "published" | "archived";
export type GradingMode = "manual_review_default" | "auto_grade_objective";
export type ResultReleaseMode =
  | "manual_release"
  | "auto_release_on_submission"
  | "release_after_review";
export type ExamAttemptStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "pending_review"
  | "finalized"
  | "released";

export interface PlatformDefaults {
  defaultAccessCodeMaxUses: number;
  defaultAccessCodeExpiryDays: number;
  defaultExamDurationMinutes: number;
  defaultTimezone: string;
  defaultResultReleaseMode: ResultReleaseMode;
  defaultShuffleQuestions: boolean;
  defaultShuffleOptions: boolean;
}

export interface ExamRecord {
  id: string;
  title: string;
  description: string;
  instructions: string;
  status: ExamStatus;
  timezone: string;
  durationMinutes: number;
  passMark: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAccessCodeUses: number;
  gradingMode: GradingMode;
  resultReleaseMode: ResultReleaseMode;
  hasManualReviewQuestions: boolean;
  questionCount: number;
  totalPoints: number;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  startAt: string;
  endAt: string;
}

export interface AuthenticatedSession {
  uid: string;
  email?: string;
  name?: string;
  role: UserRole;
}

export interface StudentRecord {
  uid?: string;
  email: string;
  name: string;
  photoURL?: string;
  status: StudentStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CandidateUserRecord {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  status: CandidateRosterStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StudentGroupRecord {
  id: string;
  name: string;
  description: string;
  memberEmails: string[];
  memberUids?: string[];
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExamAssignmentRecord {
  id: string;
  examId: string;
  assignmentType: AssignmentType;
  assignmentSources?: AssignmentType[];
  studentGroupId?: string;
  studentGroupIds?: string[];
  studentUid?: string;
  studentEmail?: string;
  accessCodeId?: string;
  assignedBy?: string;
  assignedAt: string | null;
  status: AssignmentStatus;
}

export interface ExamAccessCodeRecord {
  id: string;
  code: string;
  examId: string;
  status: AccessCodeStatus;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string | null;
}

export interface QuestionOptionRecord {
  value: string;
  isCorrect: boolean;
}

export interface QuestionFeedbackRecord {
  whenWrong?: string;
}

export interface QuestionBankRecord {
  id: string;
  title: string;
  required: boolean;
  type: QuestionType;
  options: QuestionOptionRecord[];
  points: number;
  correctAnswer?: string;
  feedback?: QuestionFeedbackRecord;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExamQuestionRecord {
  id: string;
  examId: string;
  sourceQuestionId?: string;
  title: string;
  required: boolean;
  type: QuestionType;
  options: QuestionOptionRecord[];
  points: number;
  correctAnswer?: string;
  feedback?: QuestionFeedbackRecord;
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExamAttemptRecord {
  id: string;
  examId: string;
  studentUid: string;
  assignmentId?: string;
  status: ExamAttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  autoSubmittedAt: string | null;
  timeLimitMinutes: number;
  autoScore?: number;
  manualScore?: number;
  score?: number;
  percentage?: number;
  requiresManualReview: boolean;
  emailSent: boolean;
  examSnapshot?: Record<string, unknown>;
  studentSnapshot?: {
    name?: string;
    email?: string;
  };
}

export interface ExamCandidateRecord {
  id: string;
  examId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: CandidateExamHistoryStatus;
  score: number | null;
  percentage: number | null;
  totalPoints: number | null;
  passed: boolean | null;
  requiresManualReview: boolean;
  pendingManualReviewCount: number;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  releasedAt: string | null;
  resultEmailSent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminCandidateExamStats {
  assigned: number;
  taken: number;
  completed: number;
  averageScore: number | null;
  pendingManualReviews: number;
  lastActivityAt: string | null;
}

export interface AdminCandidateExamHistoryItem {
  examId: string;
  examTitle: string;
  status: CandidateExamHistoryStatus;
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
  requiresManualReview: boolean;
}

export interface AdminCandidate {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  status: CandidateRosterStatus;
  createdAt: string | null;
  updatedAt: string | null;
  examStats: AdminCandidateExamStats;
  examHistory: AdminCandidateExamHistoryItem[];
}

export interface CsvImportPreviewRow {
  email: string;
  name: string;
  status: "ready" | "duplicate_in_file" | "already_assigned" | "existing_roster" | "new_roster" | "invalid";
}

export interface CsvImportPreview {
  rows: CsvImportPreviewRow[];
  validRows: number;
  duplicateRows: number;
  alreadyAssignedRows: number;
  newRosterRows: number;
  existingRosterRows: number;
  invalidRows: number;
}

export interface ExamAssignmentSummary {
  examId: string;
  importedCandidateCount: number;
  selectedGroupCount: number;
  totalReachableCandidates: number;
  hasSharedAccessCode: boolean;
  selectedGroupIds: string[];
  selectedGroupNames: string[];
  sharedAccessCode: ExamAccessCodeRecord | null;
  isStepComplete: boolean;
}
