import { NextResponse } from "next/server";
import { getExamAssignmentSummary } from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";

export async function GET(
  _request: Request,
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

    const { examId } = await params;
    const summary = await getExamAssignmentSummary(examId);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to load assignment summary", error);
    return NextResponse.json({ error: "Failed to load assignment summary" }, { status: 500 });
  }
}
