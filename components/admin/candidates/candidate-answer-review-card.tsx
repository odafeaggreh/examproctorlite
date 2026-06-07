import { Check, Circle, Save } from "lucide-react";

import type {
  DummyCandidateAnswerReviewStatus,
  DummyExamCandidateAnswerRecord,
} from "@/constants/admin-exam-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatAnswerResponse,
  formatExamResultStatus,
  formatQuestionTypeLabel,
} from "@/lib/format/exam-results";
import { cn } from "@/lib/utils";

function reviewStatusVariant(status: DummyCandidateAnswerReviewStatus) {
  if (status === "reviewed" || status === "auto_graded") {
    return "success" as const;
  }

  return "warning" as const;
}

function getResponseValues(response: string | string[]) {
  return Array.isArray(response) ? response : [response];
}

function getPointsLabel(answer: DummyExamCandidateAnswerRecord) {
  if (answer.finalPoints === null) {
    return `Pending / ${answer.points} pts`;
  }

  return `${answer.finalPoints}/${answer.points} pts`;
}

function getCorrectAnswerDisplay(answer: DummyExamCandidateAnswerRecord) {
  if (answer.correctAnswer && answer.correctAnswer.length > 0) {
    return formatAnswerResponse(answer.correctAnswer);
  }

  const correctOptions =
    answer.questionOptions
      ?.filter((option) => option.isCorrect)
      .map((option) => option.value) ?? [];

  if (correctOptions.length > 0) {
    return formatAnswerResponse(correctOptions);
  }

  return "No correct answer provided.";
}

function CandidateQuestionOptions({
  answer,
}: {
  answer: DummyExamCandidateAnswerRecord;
}) {
  if (!answer.questionOptions || answer.questionOptions.length === 0) {
    return null;
  }

  const responseValues = getResponseValues(answer.response);

  return (
    <div className="mt-5 space-y-2">
      <p className="text-lg font-semibold text-slate-400">Question options</p>
      <div className="space-y-2">
        {answer.questionOptions.map((option, optionIndex) => {
          const isSelected = responseValues.includes(option.value);

          return (
            <div
              key={`${answer.id}-${option.value}`}
              className={cn(
                "grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center",
                option.isCorrect && "border-emerald-100 bg-emerald-50/70",
                isSelected &&
                  !option.isCorrect &&
                  "border-amber-100 bg-amber-50/70",
              )}
            >
              <div className="flex items-center gap-2 text-slate-500">
                {answer.questionType === "checkboxes" ? (
                  <Checkbox
                    checked={isSelected}
                    disabled
                    className="size-5 border-slate-300 bg-white disabled:opacity-100 data-checked:border-blue-600 data-checked:bg-blue-600"
                  />
                ) : answer.questionType === "dropdown" ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {optionIndex + 1}
                  </span>
                ) : isSelected ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="size-3" />
                  </span>
                ) : (
                  <Circle className="size-5 text-slate-300" />
                )}
                {answer.questionType !== "dropdown" ? (
                  <span className="text-xs font-semibold">
                    {optionIndex + 1}
                  </span>
                ) : null}
              </div>

              <p className="min-w-0 text-sm font-medium text-slate-700">
                {option.value}
              </p>

              <div className="flex flex-wrap gap-2">
                {isSelected ? (
                  <Badge variant="outline" className="bg-white">
                    Selected
                  </Badge>
                ) : null}
                {option.isCorrect ? (
                  <Badge variant="success">Correct</Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CandidateAnswerReviewCard({
  answer,
  feedback,
  onFeedbackChange,
  onSave,
}: {
  answer: DummyExamCandidateAnswerRecord;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
}) {
  const isManualReviewQuestion =
    answer.questionType === "short_text" || answer.questionType === "paragraph";

  return (
    <section className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Question {answer.order}
            </span>
            <Badge variant="outline">
              {formatQuestionTypeLabel(answer.questionType)}
            </Badge>
            <Badge variant={reviewStatusVariant(answer.reviewStatus)}>
              {formatExamResultStatus(answer.reviewStatus)}
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-7 text-slate-950">
            {answer.questionTitle}
          </h3>
        </div>
        {/* <div className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
          {getPointsLabel(answer)}
        </div> */}
      </div>

      <CandidateQuestionOptions answer={answer} />

      {isManualReviewQuestion ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 ring-1 ring-blue-100/70">
            <p className="text-base font-semibold text-blue-700">
              User&apos;s answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
              {formatAnswerResponse(answer.response)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 ring-1 ring-emerald-100/70">
            <p className="text-base font-semibold text-emerald-700">
              Correct answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
              {getCorrectAnswerDisplay(answer)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor={`${answer.id}-feedback`}>
              {isManualReviewQuestion ? "Review feedback" : "Feedback"}
            </Label>
            {isManualReviewQuestion ? (
              <Textarea
                id={`${answer.id}-feedback`}
                value={feedback}
                onChange={(event) => onFeedbackChange(event.target.value)}
                placeholder="Optional feedback for the candidate"
                className="min-h-20 rounded-2xl border-slate-200 bg-slate-50/70"
              />
            ) : (
              <div className="rounded-2xl bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">
                {answer.feedback || "No feedback added."}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-40">
            <p className="font-medium text-slate-950">Assigned points</p>
            <p className="mt-1">{answer.points} points</p>
          </div>

          {isManualReviewQuestion ? (
            <Button type="button" onClick={onSave} className="w-full lg:w-fit">
              <Save className="size-4" />
              Save review
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
