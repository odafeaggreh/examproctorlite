import type { ExamCandidateResultDTO } from "@/lib/dto/exam-results";
import type {
  ExamAttemptStatus,
  QuestionType,
} from "@/lib/types/exam-management";

export const USE_DUMMY_EXAM_RESULT_DATA = true;

export type DummyCandidateAnswerReviewStatus =
  | "auto_graded"
  | "pending_review"
  | "reviewed";

export type DummyExamCandidateRecord = {
  id: string;
  examId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ExamAttemptStatus;
  score: number | null;
  percentage: number | null;
  totalPoints: number;
  passed: boolean | null;
  requiresManualReview: boolean;
  pendingManualReviewCount: number;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  releasedAt: string | null;
  resultEmailSent: boolean;
  path: string;
};

export type DummyExamCandidateAnswerRecord = {
  id: string;
  examId: string;
  candidateId: string;
  examCandidateId: string;
  examQuestionId: string;
  sourceQuestionId?: string;
  order: number;
  questionType: QuestionType;
  questionTitle: string;
  response: string | string[];
  correctAnswer?: string | string[];
  points: number;
  autoPoints: number | null;
  manualPoints: number | null;
  finalPoints: number | null;
  isCorrect: boolean | null;
  reviewStatus: DummyCandidateAnswerReviewStatus;
  reviewedBy?: string;
  reviewedAt: string | null;
  feedback?: string;
  submittedAt: string | null;
  updatedAt: string | null;
  path: string;
};

type DummyExamCandidateBlueprint = Omit<
  DummyExamCandidateRecord,
  "id" | "examId" | "path"
>;

type DummyAnswerBlueprint = Omit<
  DummyExamCandidateAnswerRecord,
  "id" | "examId" | "candidateId" | "examCandidateId" | "path"
>;

const DUMMY_EXAM_CANDIDATE_BLUEPRINTS: DummyExamCandidateBlueprint[] = [
  {
    candidateId: "candidate_demo_001",
    candidateName: "Amara Okafor",
    candidateEmail: "amara.okafor@example.com",
    status: "released",
    score: 87,
    percentage: 87,
    totalPoints: 100,
    passed: true,
    requiresManualReview: false,
    pendingManualReviewCount: 0,
    startedAt: "2026-06-02T08:55:00.000Z",
    submittedAt: "2026-06-02T09:42:00.000Z",
    gradedAt: "2026-06-02T10:02:00.000Z",
    releasedAt: "2026-06-02T10:10:00.000Z",
    resultEmailSent: true,
  },
  {
    candidateId: "candidate_demo_002",
    candidateName: "Daniel Mensah",
    candidateEmail: "daniel.mensah@example.com",
    status: "pending_review",
    score: 64,
    percentage: 64,
    totalPoints: 100,
    passed: true,
    requiresManualReview: true,
    pendingManualReviewCount: 2,
    startedAt: "2026-06-02T09:12:00.000Z",
    submittedAt: "2026-06-02T10:08:00.000Z",
    gradedAt: null,
    releasedAt: null,
    resultEmailSent: false,
  },
  {
    candidateId: "candidate_demo_003",
    candidateName: "Fatima Bello",
    candidateEmail: "fatima.bello@example.com",
    status: "finalized",
    score: 78,
    percentage: 78,
    totalPoints: 100,
    passed: true,
    requiresManualReview: false,
    pendingManualReviewCount: 0,
    startedAt: "2026-06-02T09:01:00.000Z",
    submittedAt: "2026-06-02T09:58:00.000Z",
    gradedAt: "2026-06-02T10:30:00.000Z",
    releasedAt: null,
    resultEmailSent: false,
  },
  {
    candidateId: "candidate_demo_004",
    candidateName: "Kelechi Nwosu",
    candidateEmail: "kelechi.nwosu@example.com",
    status: "submitted",
    score: 52,
    percentage: 52,
    totalPoints: 100,
    passed: false,
    requiresManualReview: true,
    pendingManualReviewCount: 2,
    startedAt: "2026-06-02T09:33:00.000Z",
    submittedAt: "2026-06-02T10:21:00.000Z",
    gradedAt: null,
    releasedAt: null,
    resultEmailSent: false,
  },
  {
    candidateId: "candidate_demo_005",
    candidateName: "Tomi Adeyemi",
    candidateEmail: "tomi.adeyemi@example.com",
    status: "in_progress",
    score: null,
    percentage: null,
    totalPoints: 100,
    passed: null,
    requiresManualReview: false,
    pendingManualReviewCount: 0,
    startedAt: "2026-06-02T10:35:00.000Z",
    submittedAt: null,
    gradedAt: null,
    releasedAt: null,
    resultEmailSent: false,
  },
  {
    candidateId: "candidate_demo_006",
    candidateName: "Ifeoma Chukwu",
    candidateEmail: "ifeoma.chukwu@example.com",
    status: "not_started",
    score: null,
    percentage: null,
    totalPoints: 100,
    passed: null,
    requiresManualReview: false,
    pendingManualReviewCount: 0,
    startedAt: null,
    submittedAt: null,
    gradedAt: null,
    releasedAt: null,
    resultEmailSent: false,
  },
  {
    candidateId: "candidate_demo_007",
    candidateName: "Samuel Grant",
    candidateEmail: "samuel.grant@example.com",
    status: "released",
    score: 91,
    percentage: 91,
    totalPoints: 100,
    passed: true,
    requiresManualReview: false,
    pendingManualReviewCount: 0,
    startedAt: "2026-06-02T08:48:00.000Z",
    submittedAt: "2026-06-02T09:37:00.000Z",
    gradedAt: "2026-06-02T09:55:00.000Z",
    releasedAt: "2026-06-02T10:03:00.000Z",
    resultEmailSent: true,
  },
  {
    candidateId: "candidate_demo_008",
    candidateName: "Nadia Yusuf",
    candidateEmail: "nadia.yusuf@example.com",
    status: "pending_review",
    score: 69,
    percentage: 69,
    totalPoints: 100,
    passed: true,
    requiresManualReview: true,
    pendingManualReviewCount: 2,
    startedAt: "2026-06-02T09:20:00.000Z",
    submittedAt: "2026-06-02T10:15:00.000Z",
    gradedAt: null,
    releasedAt: null,
    resultEmailSent: false,
  },
];

const OBJECTIVE_ANSWER_BLUEPRINTS: DummyAnswerBlueprint[] = [
  {
    examQuestionId: "exam_question_demo_001",
    sourceQuestionId: "question_bank_demo_001",
    order: 1,
    questionTitle: "Which protocol is commonly used to secure web traffic?",
    questionType: "multiple_choice",
    response: "HTTPS",
    correctAnswer: "HTTPS",
    points: 10,
    autoPoints: 10,
    manualPoints: null,
    finalPoints: 10,
    isCorrect: true,
    reviewStatus: "auto_graded",
    reviewedAt: null,
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:08:00.000Z",
  },
  {
    examQuestionId: "exam_question_demo_002",
    sourceQuestionId: "question_bank_demo_002",
    order: 2,
    questionTitle: "Select the valid authentication factors.",
    questionType: "checkboxes",
    response: ["Password", "One-time code"],
    correctAnswer: ["Password", "One-time code", "Security key"],
    points: 15,
    autoPoints: 10,
    manualPoints: null,
    finalPoints: 10,
    isCorrect: false,
    reviewStatus: "auto_graded",
    reviewedAt: null,
    feedback: "Security key was not selected.",
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:08:00.000Z",
  },
  {
    examQuestionId: "exam_question_demo_003",
    sourceQuestionId: "question_bank_demo_003",
    order: 3,
    questionTitle: "Choose the best description of a firewall.",
    questionType: "dropdown",
    response: "A network traffic filter",
    correctAnswer: "A network traffic filter",
    points: 10,
    autoPoints: 10,
    manualPoints: null,
    finalPoints: 10,
    isCorrect: true,
    reviewStatus: "auto_graded",
    reviewedAt: null,
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:08:00.000Z",
  },
];

const PENDING_MANUAL_ANSWER_BLUEPRINTS: DummyAnswerBlueprint[] = [
  {
    examQuestionId: "exam_question_demo_004",
    sourceQuestionId: "question_bank_demo_004",
    order: 4,
    questionTitle: "Explain one reason password reuse is risky.",
    questionType: "short_text",
    response:
      "If one website is breached, attackers can try the same password on other accounts.",
    points: 15,
    autoPoints: null,
    manualPoints: null,
    finalPoints: null,
    isCorrect: null,
    reviewStatus: "pending_review",
    reviewedAt: null,
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:08:00.000Z",
  },
  {
    examQuestionId: "exam_question_demo_005",
    sourceQuestionId: "question_bank_demo_005",
    order: 5,
    questionTitle:
      "Describe how an organization should respond to a suspected phishing email.",
    questionType: "paragraph",
    response:
      "The team should avoid clicking links, report the message to security, preserve evidence, and warn affected users while the message is investigated.",
    points: 20,
    autoPoints: null,
    manualPoints: null,
    finalPoints: null,
    isCorrect: null,
    reviewStatus: "pending_review",
    reviewedAt: null,
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:08:00.000Z",
  },
];

const REVIEWED_MANUAL_ANSWER_BLUEPRINTS: DummyAnswerBlueprint[] = [
  {
    examQuestionId: "exam_question_demo_004",
    sourceQuestionId: "question_bank_demo_004",
    order: 4,
    questionTitle: "Explain one reason password reuse is risky.",
    questionType: "short_text",
    response:
      "If one website is breached, attackers can try the same password on other accounts.",
    points: 15,
    autoPoints: null,
    manualPoints: 13,
    finalPoints: 13,
    isCorrect: null,
    reviewStatus: "reviewed",
    reviewedBy: "admin_demo_001",
    reviewedAt: "2026-06-02T10:30:00.000Z",
    feedback: "Clear answer. Could mention credential stuffing by name.",
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:30:00.000Z",
  },
  {
    examQuestionId: "exam_question_demo_005",
    sourceQuestionId: "question_bank_demo_005",
    order: 5,
    questionTitle:
      "Describe how an organization should respond to a suspected phishing email.",
    questionType: "paragraph",
    response:
      "The team should avoid clicking links, report the message to security, preserve evidence, and warn affected users while the message is investigated.",
    points: 20,
    autoPoints: null,
    manualPoints: 17,
    finalPoints: 17,
    isCorrect: null,
    reviewStatus: "reviewed",
    reviewedBy: "admin_demo_001",
    reviewedAt: "2026-06-02T10:33:00.000Z",
    feedback: "Good response with practical containment steps.",
    submittedAt: "2026-06-02T10:08:00.000Z",
    updatedAt: "2026-06-02T10:33:00.000Z",
  },
];

function getExamCandidateId({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  return `${examId}_${candidateId}`;
}

function getExamCandidatePath({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  return `exams/${examId}/candidates/${candidateId}`;
}

function getAnswerPath({
  candidateId,
  examId,
  examQuestionId,
}: {
  candidateId: string;
  examId: string;
  examQuestionId: string;
}) {
  return `${getExamCandidatePath({
    candidateId,
    examId,
  })}/answers/${examQuestionId}`;
}

function buildExamCandidateRecord({
  blueprint,
  examId,
}: {
  blueprint: DummyExamCandidateBlueprint;
  examId: string;
}): DummyExamCandidateRecord {
  return {
    ...blueprint,
    id: getExamCandidateId({
      candidateId: blueprint.candidateId,
      examId,
    }),
    examId,
    path: getExamCandidatePath({
      candidateId: blueprint.candidateId,
      examId,
    }),
  };
}

function buildAnswerRecord({
  blueprint,
  candidateId,
  examId,
}: {
  blueprint: DummyAnswerBlueprint;
  candidateId: string;
  examId: string;
}): DummyExamCandidateAnswerRecord {
  const examCandidateId = getExamCandidateId({ candidateId, examId });

  return {
    ...blueprint,
    id: blueprint.examQuestionId,
    candidateId,
    examId,
    examCandidateId,
    path: getAnswerPath({
      candidateId,
      examId,
      examQuestionId: blueprint.examQuestionId,
    }),
  };
}

function getManualAnswerBlueprints(candidate: DummyExamCandidateRecord) {
  if (candidate.status === "released" || candidate.status === "finalized") {
    return REVIEWED_MANUAL_ANSWER_BLUEPRINTS;
  }

  if (candidate.requiresManualReview) {
    return PENDING_MANUAL_ANSWER_BLUEPRINTS;
  }

  return [];
}

export function getDummyExamCandidates(
  examId: string,
): DummyExamCandidateRecord[] {
  return DUMMY_EXAM_CANDIDATE_BLUEPRINTS.map((blueprint) =>
    buildExamCandidateRecord({ blueprint, examId }),
  );
}

export function toDummyCandidateResultDTO(
  candidate: DummyExamCandidateRecord,
): ExamCandidateResultDTO {
  return {
    id: candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.candidateName,
    candidateEmail: candidate.candidateEmail,
    status: candidate.status,
    score: candidate.score,
    percentage: candidate.percentage,
    requiresManualReview: candidate.requiresManualReview,
    submittedAt: candidate.submittedAt,
    startedAt: candidate.startedAt,
    emailSent: candidate.resultEmailSent,
  };
}

export function getDummyExamCandidateResults(examId: string) {
  return getDummyExamCandidates(examId).map(toDummyCandidateResultDTO);
}

export function getDummyExamCandidateAnswers({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  const candidate = getDummyExamCandidates(examId).find(
    (candidateRecord) => candidateRecord.candidateId === candidateId,
  );

  if (!candidate || candidate.status === "not_started") {
    return [];
  }

  return [
    ...OBJECTIVE_ANSWER_BLUEPRINTS,
    ...getManualAnswerBlueprints(candidate),
  ].map((blueprint) =>
    buildAnswerRecord({
      blueprint,
      candidateId,
      examId,
    }),
  );
}

export function getDummyCandidateExamResult({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  const candidate = getDummyExamCandidates(examId).find(
    (candidateRecord) => candidateRecord.candidateId === candidateId,
  );

  if (!candidate) {
    return null;
  }

  return {
    candidate: toDummyCandidateResultDTO(candidate),
    answers: getDummyExamCandidateAnswers({ candidateId, examId }),
  };
}
