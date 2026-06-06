import { NextResponse } from "next/server";

import { verifySession } from "@/lib/dal/auth";
import { updateAdminCandidateStatus } from "@/lib/dal/candidates";
import { updateCandidateStatusSchema } from "@/lib/validations/exams";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = updateCandidateStatusSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid candidate status" },
        { status: 400 },
      );
    }

    const { candidateId } = await params;
    const candidate = await updateAdminCandidateStatus({
      actorUid: session.uid,
      candidateId,
      status: parsed.data.status,
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Failed to update candidate status", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update candidate status",
      },
      { status: 500 },
    );
  }
}
