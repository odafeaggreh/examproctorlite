import "server-only";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal/auth";
import type { AuthenticatedSession } from "@/lib/types/exam-management";

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  return verifySession();
}

export async function requireAuthenticatedSession() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireAuthenticatedSession();

  if (session.role !== "admin" && session.role !== "superAdmin") {
    redirect("/dashboard");
  }

  return session;
}

export async function requireSuperAdminSession() {
  const session = await requireAuthenticatedSession();

  if (session.role !== "superAdmin") {
    redirect("/admin");
  }

  return session;
}
