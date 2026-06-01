import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifySession } from "@/lib/dal/auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { updateUserRoleSchema } from "@/lib/validations/exams";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { uid } = await params;
    const parsed = updateUserRoleSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role payload" },
        { status: 400 }
      );
    }

    const role = parsed.data.role;
    const claims = {
      role,
      admin: role === "admin" || role === "superAdmin",
      superAdmin: role === "superAdmin",
    };

    await getAdminAuth().setCustomUserClaims(uid, claims);
    await getAdminDb().collection("users").doc(uid).set(
      {
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    await getAdminDb().collection("auditLogs").add({
      actorUid: session.uid,
      action: "role.updated",
      entityType: "user",
      entityId: uid,
      metadata: {
        role,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    console.error("Failed to update role", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
