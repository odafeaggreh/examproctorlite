import { NextResponse } from "next/server";
import { attachStudentGroupsToExam } from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";
import { attachExamGroupsSchema } from "@/lib/validations/exams";

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

    const parsed = attachExamGroupsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.groupIds?.[0] ??
            "Select at least one group",
        },
        { status: 400 },
      );
    }

    const { examId } = await params;
    const summary = await attachStudentGroupsToExam({
      examId,
      createdBy: session.uid,
      groupIds: parsed.data.groupIds,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to attach student groups", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign the selected groups",
      },
      { status: 500 },
    );
  }
}
