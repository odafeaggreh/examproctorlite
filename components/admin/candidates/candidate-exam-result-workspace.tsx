"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListFilter,
  User,
} from "lucide-react";
import { toast } from "sonner";

import type { DummyExamCandidateAnswerRecord } from "@/constants/admin-exam-overview";
import { CandidateAnswerTable } from "@/components/admin/candidates/candidate-answer-table";
import { CandidateMetricCard } from "@/components/admin/candidates/candidate-metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExamCandidateResultDTO } from "@/lib/dto/exam-results";
import type { ExamListItemDTO } from "@/lib/dto/exams";
import {
  formatExamResultDateTime,
  formatExamResultStatus,
} from "@/lib/format/exam-results";
import type { ExamAttemptStatus } from "@/lib/types/exam-management";

type ReviewDraft = {
  feedback: string;
};

type AnswerViewMode = "all" | "awaiting_review";

function attemptStatusVariant(status: ExamAttemptStatus) {
  if (status === "released" || status === "finalized") {
    return "success" as const;
  }

  if (status === "pending_review" || status === "submitted") {
    return "warning" as const;
  }

  return "outline" as const;
}

function getReviewDrafts(answers: DummyExamCandidateAnswerRecord[]) {
  return answers.reduce<Record<string, ReviewDraft>>((drafts, answer) => {
    drafts[answer.id] = {
      feedback: answer.feedback ?? "",
    };

    return drafts;
  }, {});
}

export function CandidateExamResultWorkspace({
  exam,
  candidate,
  initialAnswers,
}: {
  exam: ExamListItemDTO;
  candidate: ExamCandidateResultDTO;
  initialAnswers: DummyExamCandidateAnswerRecord[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [reviewDrafts, setReviewDrafts] = useState(() =>
    getReviewDrafts(initialAnswers),
  );
  const [answerViewMode, setAnswerViewMode] = useState<AnswerViewMode>("all");

  const pendingAnswers = useMemo(
    () => answers.filter((answer) => answer.reviewStatus === "pending_review"),
    [answers],
  );
  const visibleAnswers = useMemo(
    () => (answerViewMode === "awaiting_review" ? pendingAnswers : answers),
    [answerViewMode, answers, pendingAnswers],
  );
  const possiblePoints = useMemo(
    () => answers.reduce((total, answer) => total + answer.points, 0),
    [answers],
  );
  const awardedPoints = useMemo(
    () =>
      answers.reduce(
        (total, answer) => total + Number(answer.finalPoints ?? 0),
        0,
      ),
    [answers],
  );
  const percentage =
    possiblePoints > 0
      ? Math.round((awardedPoints / possiblePoints) * 100)
      : null;

  function updateDraft({
    answerId,
    value,
  }: {
    answerId: string;
    value: string;
  }) {
    setReviewDrafts((currentDrafts) => ({
      ...currentDrafts,
      [answerId]: {
        ...currentDrafts[answerId],
        feedback: value,
      },
    }));
  }

  function saveReview(answer: DummyExamCandidateAnswerRecord) {
    const draft = reviewDrafts[answer.id];

    if (!draft) {
      toast.error("Review details could not be found.");
      return;
    }

    const reviewedAt = new Date().toISOString();

    setAnswers((currentAnswers) =>
      currentAnswers.map((currentAnswer) =>
        currentAnswer.id === answer.id
          ? {
              ...currentAnswer,
              feedback: draft.feedback.trim() || undefined,
              reviewStatus: "reviewed",
              reviewedAt,
              updatedAt: reviewedAt,
            }
          : currentAnswer,
      ),
    );
    toast.success("Review saved for this answer.");
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {candidate.candidateName}
            </h1>
            <Badge variant={attemptStatusVariant(candidate.status)}>
              {formatExamResultStatus(candidate.status)}
            </Badge>
            <Badge variant="outline">Demo data</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Candidate-level performance, submitted answers, and manual grading
            for <strong>{exam.title}</strong>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CandidateMetricCard
          icon={User}
          label="Candidate"
          value={candidate.candidateName.split(" ")[0] ?? "Candidate"}
          note={candidate.candidateEmail}
        />
        <CandidateMetricCard
          icon={CheckCircle2}
          label="Score"
          value={percentage === null ? "—" : `${percentage}%`}
          note={`${awardedPoints}/${exam.totalPoints || possiblePoints} points`}
        />
        <CandidateMetricCard
          icon={AlertTriangle}
          label="Manual review"
          value={`${pendingAnswers.length}`}
          note={
            pendingAnswers.length === 0
              ? "No answers waiting"
              : "Answers waiting for grading"
          }
        />
        <CandidateMetricCard
          icon={Clock}
          label="Submitted"
          value={candidate.submittedAt ? "Submitted" : "Not submitted"}
          note={formatExamResultDateTime(
            candidate.submittedAt ?? candidate.startedAt,
          )}
        />
      </div>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="text-lg">Result snapshot</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Quick context for the candidate, exam, timing, and release state.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Exam
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {exam.title}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Started
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {formatExamResultDateTime(candidate.startedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Submitted
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {formatExamResultDateTime(candidate.submittedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Result email
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {candidate.emailSent ? "Sent" : "Not sent"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Answers</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Review every answer in order, including options, responses,
                grading state, and feedback.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-2xl border-slate-200"
                  aria-label="Sort answers"
                >
                  <ListFilter className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  Show answers
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={answerViewMode}
                  onValueChange={(value) =>
                    setAnswerViewMode(value as AnswerViewMode)
                  }
                >
                  <DropdownMenuRadioItem
                    value="all"
                    className="rounded-xl px-3 py-2"
                  >
                    All answers
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="awaiting_review"
                    className="rounded-xl px-3 py-2"
                  >
                    Awaiting review
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <CandidateAnswerTable
            answers={visibleAnswers}
            emptyDescription={
              answerViewMode === "awaiting_review"
                ? "All submitted written answers have been reviewed."
                : "This candidate has not submitted answers for this exam yet."
            }
            emptyTitle={
              answerViewMode === "awaiting_review"
                ? "No answers awaiting review"
                : "No answers yet"
            }
            getFeedback={(answerId) => reviewDrafts[answerId]?.feedback ?? ""}
            onFeedbackChange={(answerId, value) =>
              updateDraft({ answerId, value })
            }
            onSave={saveReview}
          />
        </CardContent>
      </Card>
    </div>
  );
}
