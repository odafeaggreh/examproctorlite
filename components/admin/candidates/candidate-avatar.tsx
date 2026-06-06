import type { AdminCandidate } from "@/lib/types/exam-management";
import { getCandidateInitials } from "@/lib/format/candidates";

export function CandidateAvatar({
  candidate,
  size = "sm",
}: {
  candidate: Pick<AdminCandidate, "name" | "photoURL">;
  size?: "sm" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "size-16 rounded-[22px]" : "size-10 rounded-2xl";

  if (candidate.photoURL) {
    return (
      <img
        alt=""
        className={`${sizeClass} border border-slate-100 object-cover`}
        src={candidate.photoURL}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center bg-blue-50 font-semibold text-blue-700 ${
        size === "lg" ? "text-lg" : "text-sm"
      }`}
    >
      {getCandidateInitials(candidate.name)}
    </div>
  );
}
