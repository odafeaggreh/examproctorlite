import { NextResponse } from "next/server";
import { updateQuestionBankRecord } from "@/lib/data/questions";
import { verifySession } from "@/lib/dal/auth";
import { toQuestionBankItemDTO } from "@/lib/dto/questions";
import { createQuestionSchema } from "@/lib/validations/questions";

function isAdminRole(role: string) {
  return role === "admin" || role === "superAdmin";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
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

    const { questionId } = await params;
    const question = await updateQuestionBankRecord({
      questionId,
      payload: parsed.data,
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ question: toQuestionBankItemDTO(question) });
  } catch (error) {
    console.error("Failed to update question", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}
