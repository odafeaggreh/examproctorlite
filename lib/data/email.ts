import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import pLimit from "p-limit";
import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  EmailRecipientResult,
  SendEmailPayload,
  SendEmailResult,
} from "@/lib/types/email";

const EMAIL_DAILY_SEND_LIMIT = 100;
const EMAIL_CONCURRENCY_LIMIT = 5;
const EMAIL_FROM_ADDRESS = "onboarding@resend.dev";
// Leave like this for now
// const EMAIL_FROM_ADDRESS = "noreply@examproctolite.online";
const EMAIL_FROM_NAME = "ExamProctorLite";

type ReservedEmailQuota = {
  date: string;
  remainingToday: number;
};

type SendEmailBatchOptions = {
  payload: SendEmailPayload;
  requestedBy: string;
  source?: string;
};

export class EmailQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailQuotaExceededError";
  }
}

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

function getEmailUsageDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function createRequestId() {
  return getAdminDb().collection("emailSendLogs").doc().id;
}

function normalizeRecipients(recipients: string[]) {
  return Array.from(
    new Set(
      recipients.map((email) => email.trim().toLowerCase()).filter(Boolean),
    ),
  );
}

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new EmailConfigurationError("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function formatSenderAddress(fromName?: string) {
  const safeName = (fromName || EMAIL_FROM_NAME)
    .replace(/[<>"\r\n]/g, "")
    .trim();

  return `${safeName || EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;
}

async function reserveDailyEmailQuota(
  requestedCount: number,
): Promise<ReservedEmailQuota> {
  const db = getAdminDb();
  const date = getEmailUsageDate();
  const usageReference = db.collection("emailDailyUsage").doc(date);
  let remainingToday = 0;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageReference);
    const data = snapshot.exists ? snapshot.data() : undefined;
    const attemptedCount = Number(data?.attemptedCount ?? 0);
    const nextAttemptedCount = attemptedCount + requestedCount;

    if (nextAttemptedCount > EMAIL_DAILY_SEND_LIMIT) {
      const remaining = Math.max(EMAIL_DAILY_SEND_LIMIT - attemptedCount, 0);

      throw new EmailQuotaExceededError(
        `Daily email limit exceeded. ${remaining} email send${
          remaining === 1 ? "" : "s"
        } remaining today.`,
      );
    }

    remainingToday = EMAIL_DAILY_SEND_LIMIT - nextAttemptedCount;

    if (snapshot.exists) {
      transaction.set(
        usageReference,
        {
          attemptedCount: FieldValue.increment(requestedCount),
          limit: EMAIL_DAILY_SEND_LIMIT,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    transaction.set(usageReference, {
      date,
      limit: EMAIL_DAILY_SEND_LIMIT,
      attemptedCount: requestedCount,
      sentCount: 0,
      failedCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return {
    date,
    remainingToday,
  };
}

async function sendSingleEmail({
  resend,
  requestId,
  payload,
  from,
  to,
  index,
}: {
  resend: Resend;
  requestId: string;
  payload: SendEmailPayload;
  from: string;
  to: string;
  index: number;
}): Promise<EmailRecipientResult> {
  try {
    const basePayload = {
      from,
      to,
      subject: payload.subject,
      replyTo: payload.replyTo,
    };
    const emailPayload: CreateEmailOptions = payload.html
      ? {
          ...basePayload,
          html: payload.html,
          text: payload.text,
        }
      : {
          ...basePayload,
          text: payload.text ?? "",
        };
    const response = await resend.emails.send(emailPayload, {
      idempotencyKey: `${requestId}:${index}:${to}`,
    });

    if (response.error) {
      return {
        to,
        status: "failed",
        error: response.error.message,
      };
    }

    return {
      to,
      status: "sent",
      providerMessageId: response.data?.id,
    };
  } catch (error) {
    return {
      to,
      status: "failed",
      error:
        error instanceof Error ? error.message : "Failed to send the email.",
    };
  }
}

async function writeEmailSendResults({
  requestId,
  date,
  payload,
  from,
  requestedBy,
  source,
  results,
}: {
  requestId: string;
  date: string;
  payload: SendEmailPayload;
  from: string;
  requestedBy: string;
  source?: string;
  results: EmailRecipientResult[];
}) {
  const db = getAdminDb();
  const batch = db.batch();
  const sentCount = results.filter((result) => result.status === "sent").length;
  const failedCount = results.length - sentCount;

  batch.set(
    db.collection("emailDailyUsage").doc(date),
    {
      sentCount: FieldValue.increment(sentCount),
      failedCount: FieldValue.increment(failedCount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  results.forEach((result, index) => {
    batch.set(db.collection("emailSendLogs").doc(`${requestId}_${index}`), {
      requestId,
      provider: "resend",
      providerMessageId: result.providerMessageId ?? null,
      to: result.to,
      from,
      subject: payload.subject,
      status: result.status,
      error: result.error ?? null,
      requestedBy,
      source: source ?? null,
      metadata: payload.metadata ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    sentCount,
    failedCount,
  };
}

export async function sendEmailBatch({
  payload,
  requestedBy,
  source,
}: SendEmailBatchOptions): Promise<SendEmailResult> {
  const to = normalizeRecipients(payload.to);
  const requestId = createRequestId();
  const from = formatSenderAddress(payload.fromName);
  const resend = createResendClient();
  const quota = await reserveDailyEmailQuota(to.length);
  const limit = pLimit(EMAIL_CONCURRENCY_LIMIT);
  const results = await Promise.all(
    to.map((recipient, index) =>
      limit(() =>
        sendSingleEmail({
          resend,
          requestId,
          payload: {
            ...payload,
            to,
          },
          from,
          to: recipient,
          index,
        }),
      ),
    ),
  );
  const counts = await writeEmailSendResults({
    requestId,
    date: quota.date,
    payload: {
      ...payload,
      to,
    },
    from,
    requestedBy,
    source,
    results,
  });

  return {
    requestId,
    date: quota.date,
    dailyLimit: EMAIL_DAILY_SEND_LIMIT,
    remainingToday: quota.remainingToday,
    sentCount: counts.sentCount,
    failedCount: counts.failedCount,
    results,
  };
}

export { EMAIL_DAILY_SEND_LIMIT, EMAIL_FROM_ADDRESS };
