import { NextResponse } from "next/server";
import {
  EmailConfigurationError,
  EmailQuotaExceededError,
  sendEmailBatch,
} from "@/lib/data/email";
import { verifySession } from "@/lib/dal/auth";
import { sendEmailSchema } from "@/lib/validations/email";

export async function POST(request: Request) {
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

    const parsed = sendEmailSchema.safeParse(await request.json());

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          error:
            errors.to?.[0] ??
            errors.subject?.[0] ??
            errors.text?.[0] ??
            errors.html?.[0] ??
            errors.replyTo?.[0] ??
            "Invalid email payload",
        },
        { status: 400 },
      );
    }

    const { source, ...payload } = parsed.data;
    const result = await sendEmailBatch({
      payload,
      requestedBy: session.uid,
      source: source ?? "admin_generic_email",
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Failed to send email", error);

    if (error instanceof EmailQuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof EmailConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
