import { NextResponse } from "next/server";
import { createOrReplaceSharedExamAccessCode } from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";
import { createSharedAccessCodeSchema } from "@/lib/validations/exams";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ examId: string }> },
) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createSharedAccessCodeSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.maxUses?.[0] ??
            parsed.error.flatten().fieldErrors.expiresInDays?.[0] ??
            "Invalid access code settings",
        },
        { status: 400 },
      );
    }

    const { examId } = await params;
    const accessCode = await createOrReplaceSharedExamAccessCode({
      examId,
      createdBy: session.uid,
      maxUses: parsed.data.maxUses,
      expiresInDays: parsed.data.expiresInDays,
    });

    return NextResponse.json({ accessCode });
  } catch (error) {
    console.error("Failed to create shared access code", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create the shared exam code",
      },
      { status: 500 },
    );
  }
}
