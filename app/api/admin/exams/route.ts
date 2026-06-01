import { NextResponse } from "next/server";
import { createOrReplaceSharedExamAccessCode } from "@/lib/data/exam-setup";
import { createExamRecord } from "@/lib/data/exams";
import { verifySession } from "@/lib/dal/auth";
import { toExamListItemDTO } from "@/lib/dto/exams";
import { createExamSchema } from "@/lib/validations/exams";

export async function POST(request: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createExamSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.title?.[0] ??
            "Invalid exam payload",
        },
        { status: 400 }
      );
    }

    const exam = await createExamRecord({
      createdBy: session.uid,
      payload: parsed.data,
    });
    const accessCode = await createOrReplaceSharedExamAccessCode({
      examId: exam.id,
      createdBy: session.uid,
      maxUses: exam.maxAccessCodeUses,
    });

    return NextResponse.json(
      { exam: toExamListItemDTO(exam), accessCode },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create exam", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
