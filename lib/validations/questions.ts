import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().trim().min(1, "Question title is required").max(1000),
  required: z.boolean().optional().default(true),
  type: z
    .enum([
      "multiple_choice",
      "checkboxes",
      "dropdown",
      "short_text",
      "paragraph",
    ])
    .default("multiple_choice"),
  options: z
    .array(
      z.object({
        value: z.string().trim().min(1, "Option text is required").max(500),
        isCorrect: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default([]),
  points: z.coerce.number().int().min(0).max(100).optional().default(1),
  correctAnswer: z.string().trim().max(500).optional().default(""),
  feedback: z
    .object({
      whenWrong: z.string().trim().max(1000).optional(),
    })
    .optional()
    .default({}),
});
