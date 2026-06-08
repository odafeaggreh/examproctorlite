import "server-only";

import {
  getCandidateUserRecord,
  getExamCandidateRecord,
  listExamCandidateAnswerRecords,
  listAllExamCandidateRecords,
  listCandidateUserRecords,
  listExamCandidateRecordsForCandidate,
  updateCandidateUserStatus,
} from "@/lib/data/candidates";
import { listExams } from "@/lib/data/exams";
import {
  toAdminCandidateDTO,
  toCandidateStatusDTO,
} from "@/lib/dto/candidates";
import { toExamCandidateResultFromCandidateDTO } from "@/lib/dto/exam-results";
import type { CandidateRosterStatus } from "@/lib/types/exam-management";

export async function getAdminCandidates() {
  const [users, examCandidates, exams] = await Promise.all([
    listCandidateUserRecords(),
    listAllExamCandidateRecords(),
    listExams(),
  ]);

  return users
    .map((user) =>
      toAdminCandidateDTO({
        user,
        exams,
        examCandidates: examCandidates.filter(
          (examCandidate) => examCandidate.candidateId === user.uid,
        ),
      }),
    )
    .sort((first, second) => first.name.localeCompare(second.name));
}

export async function getAdminCandidateById(candidateId: string) {
  const user = await getCandidateUserRecord(candidateId);

  if (!user) {
    return null;
  }

  const [examCandidates, exams] = await Promise.all([
    listExamCandidateRecordsForCandidate(candidateId),
    listExams(),
  ]);

  return toAdminCandidateDTO({
    user,
    exams,
    examCandidates,
  });
}

export async function getAdminCandidateExamResult({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  const candidate = await getExamCandidateRecord({ candidateId, examId });

  if (!candidate) {
    return null;
  }

  const answers = await listExamCandidateAnswerRecords({ candidate });

  return {
    candidate: toExamCandidateResultFromCandidateDTO(candidate),
    answers,
  };
}

export async function updateAdminCandidateStatus({
  actorUid,
  candidateId,
  status,
}: {
  actorUid: string;
  candidateId: string;
  status: CandidateRosterStatus;
}) {
  const candidate = await updateCandidateUserStatus({
    actorUid,
    candidateId,
    status,
  });

  return toCandidateStatusDTO(candidate);
}
