import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { AuthenticatedSession, UserRole } from "@/lib/types/exam-management";

function normalizeRole(
  claims: Record<string, unknown> | undefined
): UserRole {
  if (claims?.role === "superAdmin") {
    return "superAdmin";
  }

  if (claims?.role === "admin" || claims?.admin === true) {
    return "admin";
  }

  return "student";
}

export const verifySession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );

    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      role: normalizeRole(decoded),
    };
  } catch (error) {
    console.error("Failed to verify session cookie", error);
    return null;
  }
});
