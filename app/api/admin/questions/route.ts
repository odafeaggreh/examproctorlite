import { NextResponse } from "next/server";
import { createQuestionBankRecord } from "@/lib/data/questions";
import { verifySession } from "@/lib/dal/auth";
import { getAdminQuestionBank } from "@/lib/dal/questions";
import { toQuestionBankItemDTO } from "@/lib/dto/questions";
import { createQuestionSchema } from "@/lib/validations/questions";

function isAdminRole(role: string) {
  return role === "admin" || role === "superAdmin";
}

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await getAdminQuestionBank();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Failed to list question bank", error);
    return NextResponse.json(
      { error: "Failed to load question bank" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createQuestionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.title?.[0] ??
            parsed.error.flatten().fieldErrors.options?.[0] ??
            "Invalid question payload",
        },
        { status: 400 },
      );
    }

    const question = await createQuestionBankRecord({
      createdBy: session.uid,
      payload: parsed.data,
    });

    return NextResponse.json(
      { question: toQuestionBankItemDTO(question) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create question", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}
