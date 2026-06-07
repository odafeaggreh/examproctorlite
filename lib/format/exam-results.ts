import type { QuestionType } from "@/lib/types/exam-management";

export function formatExamResultDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatExamResultStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatQuestionTypeLabel(value: QuestionType) {
  switch (value) {
    case "multiple_choice":
      return "Multiple choice";
    case "checkboxes":
      return "Checkboxes";
    case "short_text":
      return "Short text";
    case "paragraph":
      return "Paragraph";
    default:
      return "Dropdown";
  }
}

export function formatAnswerResponse(value: string | string[] | undefined) {
  if (!value || value.length === 0) {
    return "No response";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}
