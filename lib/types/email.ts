export type EmailProvider = "resend";
export type EmailDeliveryStatus = "sent" | "failed";

export interface EmailDailyUsageRecord {
  id: string;
  date: string;
  limit: number;
  attemptedCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmailSendLogRecord {
  id: string;
  requestId: string;
  provider: EmailProvider;
  providerMessageId?: string;
  to: string;
  from: string;
  subject: string;
  status: EmailDeliveryStatus;
  error?: string;
  requestedBy: string;
  source?: string;
  metadata?: Record<string, string>;
  createdAt: string | null;
}

export interface SendEmailPayload {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
  metadata?: Record<string, string>;
}

export interface EmailRecipientResult {
  to: string;
  status: EmailDeliveryStatus;
  providerMessageId?: string;
  error?: string;
}

export interface SendEmailResult {
  requestId: string;
  date: string;
  dailyLimit: number;
  remainingToday: number;
  sentCount: number;
  failedCount: number;
  results: EmailRecipientResult[];
}
