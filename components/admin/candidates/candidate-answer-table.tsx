import { FileText } from "lucide-react";

import type { DummyExamCandidateAnswerRecord } from "@/constants/admin-exam-overview";
import { CandidateAnswerReviewCard } from "@/components/admin/candidates/candidate-answer-review-card";

export function CandidateAnswerTable({
  answers,
  emptyDescription = "This candidate has not submitted answers for this exam yet.",
  emptyTitle = "No answers yet",
  getFeedback,
  onFeedbackChange,
  onSave,
}: {
  answers: DummyExamCandidateAnswerRecord[];
  emptyDescription?: string;
  emptyTitle?: string;
  getFeedback: (answerId: string) => string;
  onFeedbackChange: (answerId: string, value: string) => void;
  onSave: (answer: DummyExamCandidateAnswerRecord) => void;
}) {
  if (answers.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400">
          <FileText className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => (
        <CandidateAnswerReviewCard
          key={answer.id}
          answer={answer}
          feedback={getFeedback(answer.id)}
          onFeedbackChange={(value) => onFeedbackChange(answer.id, value)}
          onSave={() => onSave(answer)}
        />
      ))}
    </div>
  );
}
