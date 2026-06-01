import type { UserRole } from "@/lib/types/exam-management";

export function normalizeUserRole(rawRole: unknown): UserRole {
  if (rawRole === "superAdmin") {
    return "superAdmin";
  }

  if (rawRole === "admin") {
    return "admin";
  }

  return "student";
}
