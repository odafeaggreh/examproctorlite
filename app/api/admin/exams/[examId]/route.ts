import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal/auth";
import { updateExamRecord } from "@/lib/data/exams";
import { toExamListItemDTO } from "@/lib/dto/exams";
import { createExamSchema } from "@/lib/validations/exams";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
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
        { error: "Invalid exam payload" },
        { status: 400 }
      );
    }

    const { examId } = await params;
    const exam = await updateExamRecord({
      examId,
      payload: parsed.data,
    });

    return NextResponse.json({ exam: toExamListItemDTO(exam) });
  } catch (error) {
    console.error("Failed to update exam", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update exam",
      },
      { status: 500 }
    );
  }
}
