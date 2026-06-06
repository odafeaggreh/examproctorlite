import { z } from "zod";

const optionQuestionTypes = ["multiple_choice", "checkboxes", "dropdown"];

export const examQuestionSchema = z
  .object({
    sourceQuestionId: z.string().trim().min(1).optional(),
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
  })
  .superRefine((question, context) => {
    if (!optionQuestionTypes.includes(question.type)) {
      return;
    }

    if (question.options.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Add at least two answer options.",
        path: ["options"],
      });
    }

    if (!question.options.some((option) => option.isCorrect)) {
      context.addIssue({
        code: "custom",
        message: "Mark at least one correct answer.",
        path: ["options"],
      });
    }
  });

export const createExamSchema = z
  .object({
    title: z.string().trim().min(1, "Exam title is required").max(120),
    description: z.string().trim().max(600).optional().default(""),
    instructions: z.string().trim().max(4000).optional().default(""),
    durationMinutes: z.coerce.number().int().positive().max(1440).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    maxAccessCodeUses: z.coerce.number().int().positive().max(5000).optional(),
    gradingMode: z
      .enum(["manual_review_default", "auto_grade_objective"])
      .optional(),
    resultReleaseMode: z
      .enum([
        "manual_release",
        "auto_release_on_submission",
        "release_after_review",
      ])
      .optional(),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
    shuffleQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    passMark: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    questions: z
      .array(examQuestionSchema)
      .min(1, "Add at least one question before saving."),
  })
  .refine(
    (data) => new Date(data.endAt).getTime() > new Date(data.startAt).getTime(),
    {
      message: "Close time must be after open time.",
      path: ["endAt"],
    },
  );

export const updateUserRoleSchema = z.object({
  role: z.enum(["student", "admin", "superAdmin"]),
});

export const updateCandidateStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const createStudentGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120),
  description: z.string().trim().max(300).optional().default(""),
  memberEmails: z
    .array(z.string().email().transform((value) => value.trim().toLowerCase()))
    .min(1, "Add at least one email address."),
});

export const importExamAssignmentsSchema = z.object({
  csvText: z.string().trim().min(1, "Upload a CSV file to continue."),
  previewOnly: z.boolean().optional().default(false),
});

export const attachExamGroupsSchema = z.object({
  groupIds: z.array(z.string().trim().min(1)).min(1, "Select at least one group."),
});

export const createSharedAccessCodeSchema = z.object({
  maxUses: z.coerce.number().int().positive().max(5000),
  expiresInDays: z.coerce.number().int().positive().max(365).optional(),
});

export const updateExamPublicationStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});
