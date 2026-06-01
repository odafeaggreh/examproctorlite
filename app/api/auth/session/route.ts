import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { createSessionSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const parsed = createSessionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.idToken?.[0] ?? "Invalid session payload" },
        { status: 400 }
      );
    }

    const { idToken } = parsed.data;

    const expiresIn = SESSION_MAX_AGE_MS;
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn,
    });
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    const role =
      decodedToken.role === "superAdmin"
        ? "superAdmin"
        : decodedToken.role === "admin" || decodedToken.admin === true
        ? "admin"
        : "student";

    const response = NextResponse.json({ role });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return response;
  } catch (error) {
    console.error("Failed to create session cookie", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
