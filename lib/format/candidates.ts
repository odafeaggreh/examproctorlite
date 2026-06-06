export function getCandidateInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "C";
}

export function formatCandidateScore(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function formatCandidateStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getAdminCandidateHref(candidateId: string) {
  return `/admin/candidates/${candidateId}`;
}

export function getAdminCandidateExamHref({
  candidateId,
  examId,
}: {
  candidateId: string;
  examId: string;
}) {
  return `/admin/candidates/${candidateId}/exams/${examId}`;
}
