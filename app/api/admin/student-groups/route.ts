import { NextResponse } from "next/server";
import { createStudentGroupRecord, listStudentGroups } from "@/lib/data/exam-setup";
import { verifySession } from "@/lib/dal/auth";
import { createStudentGroupSchema } from "@/lib/validations/exams";

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groups = await listStudentGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to list student groups", error);
    return NextResponse.json({ error: "Failed to load student groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const group = await createStudentGroupRecord({
      createdBy: session.uid,
      payload: parsed.data,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Failed to create student group", error);
    return NextResponse.json({ error: "Failed to save the group" }, { status: 500 });
  }
}
