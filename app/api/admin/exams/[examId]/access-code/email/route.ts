import { NextResponse } from "next/server";
import {
  EmailConfigurationError,
  EmailQuotaExceededError,
  sendEmailBatch,
} from "@/lib/data/email";
import { getSharedExamAccessCode } from "@/lib/data/exam-setup";
import { getExamRecord } from "@/lib/data/exams";
import { verifySession } from "@/lib/dal/auth";
import { buildExamAccessCodeEmail } from "@/lib/email/exam-access-code";
import { sendExamAccessCodeEmailSchema } from "@/lib/validations/email";

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

    const parsed = sendExamAccessCodeEmailSchema.safeParse(
      await request.json(),
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.to?.[0] ??
            "Invalid email recipients",
        },
        { status: 400 },
      );
    }

    const { examId } = await params;
    const [exam, accessCode] = await Promise.all([
      getExamRecord(examId),
      getSharedExamAccessCode(examId),
    ]);

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (!accessCode || accessCode.status !== "active") {
      return NextResponse.json(
        { error: "No active access code found for this exam" },
        { status: 404 },
      );
    }

    const email = await buildExamAccessCodeEmail({
      examTitle: exam.title,
      accessCode: accessCode.code,
    });
    const result = await sendEmailBatch({
      payload: {
        to: parsed.data.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        metadata: {
          examId,
          accessCodeId: accessCode.id,
        },
      },
      requestedBy: session.uid,
      source: "exam_access_code",
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Failed to send exam access code email", error);

    if (error instanceof EmailQuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof EmailConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to send exam access code email" },
      { status: 500 },
    );
  }
}
