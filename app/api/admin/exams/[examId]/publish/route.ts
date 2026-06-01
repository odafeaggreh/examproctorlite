import { NextResponse } from "next/server";
import { updateExamPublicationStatus } from "@/lib/data/exams";
import { verifySession } from "@/lib/dal/auth";
import { toExamListItemDTO } from "@/lib/dto/exams";
import { updateExamPublicationStatusSchema } from "@/lib/validations/exams";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ examId: string }> },
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

    const parsed = updateExamPublicationStatusSchema.safeParse(
      await request.json(),
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid publication status" },
        { status: 400 },
      );
    }

    const { examId } = await params;
    const exam = await updateExamPublicationStatus({
      examId,
      status: parsed.data.status,
    });

    return NextResponse.json({ exam: toExamListItemDTO(exam) });
  } catch (error) {
    console.error("Failed to update exam publication status", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update exam publication status",
      },
      { status: 500 },
    );
  }
}
