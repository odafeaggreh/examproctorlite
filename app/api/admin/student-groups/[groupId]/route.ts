import { NextResponse } from "next/server";
import { updateStudentGroupRecord } from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";
import { createStudentGroupSchema } from "@/lib/validations/exams";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createStudentGroupSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.name?.[0] ??
            parsed.error.flatten().fieldErrors.memberEmails?.[0] ??
            "Invalid group details",
        },
        { status: 400 },
      );
    }

    const { groupId } = await params;
    const group = await updateStudentGroupRecord({
      groupId,
      payload: parsed.data,
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Failed to update student group", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update the group",
      },
      { status: 500 },
    );
  }
}
