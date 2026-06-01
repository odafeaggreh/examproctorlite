import { NextResponse } from "next/server";
import {
  importExamAssignmentsFromCsv,
  previewExamAssignmentImport,
} from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";
import { importExamAssignmentsSchema } from "@/lib/validations/exams";

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

    const parsed = importExamAssignmentsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.csvText?.[0] ??
            "Upload a valid CSV file",
        },
        { status: 400 },
      );
    }

    const { examId } = await params;

    if (parsed.data.previewOnly) {
      const preview = await previewExamAssignmentImport({
        examId,
        csvText: parsed.data.csvText,
      });
      return NextResponse.json({ preview });
    }

    const summary = await importExamAssignmentsFromCsv({
      examId,
      createdBy: session.uid,
      csvText: parsed.data.csvText,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to import exam assignments", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import candidates",
      },
      { status: 500 },
    );
  }
}
