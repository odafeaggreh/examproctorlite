import { google } from "googleapis";
import { NextResponse } from "next/server";
import { GoogleFormsResponse, FormItem } from "@/app/types/googleForms";

interface GoogleError {
  code: number;
  errors: Array<{
    message: string;
    domain: string;
    reason: string;
  }>;
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: [
    "https://www.googleapis.com/auth/forms.body.readonly",
    "https://www.googleapis.com/auth/forms.responses.readonly",
  ],
});

const forms = google.forms({
  version: "v1",
  auth,
});

export async function GET() {
  try {
    const formId = process.env.NEXT_PUBLIC_GOOGLE_FORM_ID;

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID not configured" },
        { status: 500 }
      );
    }

    const form = await forms.forms.get({
      formId,
    });

    const formData = form.data as GoogleFormsResponse;

    const questions = formData.items
      .filter((item) => {
        if (!item.questionItem) return false;

        const questionItem = item.questionItem.question;

        const hasCorrectAnswer = Boolean(
          questionItem?.grading?.correctAnswers?.answers?.[0]?.value
        );

        return hasCorrectAnswer;
      })
      .map((item) => {
        const questionItem = item.questionItem!.question;
        let options: Array<{ value: string; isCorrect: boolean }> = [];

        // Handle multiple choice questions
        if (questionItem?.choiceQuestion) {
          const choiceOptions = questionItem.choiceQuestion.options || [];
          const correctAnswerIndex =
            questionItem?.grading?.correctAnswers?.answers?.[0]?.value;

          options = choiceOptions.map((option, index) => ({
            value: option.value,
            isCorrect: String(index) === correctAnswerIndex,
          }));
        }

        return {
          id: item.itemId,
          title: item.title,
          required: questionItem?.required || false,
          type: getQuestionType(item),
          options,
          points: questionItem?.grading?.pointValue || 0,
          correctAnswer:
            questionItem?.grading?.correctAnswers?.answers?.[0]?.value,
          feedback: {
            whenWrong: questionItem?.grading?.whenWrong?.text,
          },
        };
      });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error details:", error);

    if (isGoogleError(error)) {
      if (error.code === 403) {
        return NextResponse.json(
          {
            error:
              "Authentication or permission error. Please check API credentials and form permissions.",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// Type guard for GoogleError
function isGoogleError(error: unknown): error is GoogleError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "errors" in error
  );
}

// Helper function to determine question type
function getQuestionType(
  item: FormItem
): "RADIO" | "PARAGRAPH" | "TEXT" | "UNKNOWN" {
  if (item.questionItem?.question.choiceQuestion) {
    return "RADIO";
  } else if (item.questionItem?.question.textQuestion) {
    return item.questionItem.question.textQuestion.paragraph
      ? "PARAGRAPH"
      : "TEXT";
  }
  return "UNKNOWN";
}
