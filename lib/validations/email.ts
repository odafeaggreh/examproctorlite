import { z } from "zod";

const emailAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const sendEmailSchema = z
  .object({
    to: z
      .array(emailAddressSchema)
      .min(1, "Add at least one recipient.")
      .max(100, "You can send to at most 100 recipients at once.")
      .transform((emails) => Array.from(new Set(emails))),
    subject: z.string().trim().min(1, "Subject is required.").max(160),
    text: z.string().trim().max(20000).optional(),
    html: z.string().trim().max(100000).optional(),
    fromName: z.string().trim().max(80).optional(),
    replyTo: emailAddressSchema.optional(),
    source: z.string().trim().max(80).optional(),
    metadata: z.record(z.string(), z.string().trim().max(500)).optional(),
  })
  .superRefine((payload, context) => {
    if (!payload.text && !payload.html) {
      context.addIssue({
        code: "custom",
        message: "Add either text or html email content.",
        path: ["text"],
      });
    }
  });

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export const sendExamAccessCodeEmailSchema = z.object({
  to: z
    .array(emailAddressSchema)
    .min(1, "Add at least one recipient.")
    .max(100, "You can send to at most 100 recipients at once.")
    .transform((emails) => Array.from(new Set(emails))),
});

export type SendExamAccessCodeEmailInput = z.infer<
  typeof sendExamAccessCodeEmailSchema
>;
