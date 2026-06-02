import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  PencilLine,
  User,
} from "lucide-react";

import {
  getDummyCandidateExamResult,
  type DummyExamCandidateAnswerRecord,
  type DummyCandidateAnswerReviewStatus,
} from "@/constants/admin-exam-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminExamById } from "@/lib/dal/exams";
import type { ExamAttemptStatus, QuestionType } from "@/lib/types/exam-management";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatQuestionType(value: QuestionType) {
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

function formatResponse(value: string | string[] | undefined) {
  if (!value) {
    return "No response";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}

function attemptStatusVariant(status: ExamAttemptStatus) {
  if (status === "released" || status === "finalized") {
    return "success" as const;
  }

  if (status === "pending_review" || status === "submitted") {
    return "warning" as const;
  }

  return "outline" as const;
}

function reviewStatusVariant(status: DummyCandidateAnswerReviewStatus) {
  if (status === "reviewed" || status === "auto_graded") {
    return "success" as const;
  }

  return "warning" as const;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof User;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-none">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnswerReviewCard({
  answer,
}: {
  answer: DummyExamCandidateAnswerRecord;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Question {answer.order}
            </span>
            <Badge variant="outline">{formatQuestionType(answer.questionType)}</Badge>
            <Badge variant={reviewStatusVariant(answer.reviewStatus)}>
              {formatStatus(answer.reviewStatus)}
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            {answer.questionTitle}
          </h3>
        </div>
        <div className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
          {answer.finalPoints ?? "—"}/{answer.points} pts
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Candidate response
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {formatResponse(answer.response)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Expected answer
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {formatResponse(answer.correctAnswer)}
          </p>
        </div>
      </div>

      {answer.feedback ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          {answer.feedback}
        </div>
      ) : null}
    </div>
  );
}

function AnswersTable({
  answers,
}: {
  answers: DummyExamCandidateAnswerRecord[];
}) {
  if (answers.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400">
          <FileText className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">
          No answers yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          This candidate has not submitted answers for this exam yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
      <Table className="min-w-[760px]">
        <TableHeader className="bg-slate-50/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Question
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Type
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Review
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Points
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {answers.map((answer) => (
            <TableRow key={answer.id}>
              <TableCell className="max-w-[360px] px-5 py-4">
                <p className="truncate font-medium text-slate-950">
                  {answer.questionTitle}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatResponse(answer.response)}
                </p>
              </TableCell>
              <TableCell className="px-5 py-4 text-sm text-slate-600">
                {formatQuestionType(answer.questionType)}
              </TableCell>
              <TableCell className="px-5 py-4">
                <Badge variant={reviewStatusVariant(answer.reviewStatus)}>
                  {formatStatus(answer.reviewStatus)}
                </Badge>
              </TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-slate-950">
                {answer.finalPoints ?? "—"}/{answer.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminCandidateExamResultPage({
  params,
}: {
  params: Promise<{ candidateId: string; examId: string }>;
}) {
  const { candidateId, examId } = await params;
  const [exam, candidateResult] = await Promise.all([
    getAdminExamById(examId),
    Promise.resolve(getDummyCandidateExamResult({ candidateId, examId })),
  ]);

  if (!exam || !candidateResult) {
    notFound();
  }

  const { candidate, answers } = candidateResult;
  const pendingAnswers = answers.filter(
    (answer) => answer.reviewStatus === "pending_review",
  );
  const reviewedAnswers = answers.filter(
    (answer) => answer.reviewStatus !== "pending_review",
  );
  const awardedPoints = answers.reduce(
    (total, answer) => total + Number(answer.finalPoints ?? 0),
    0,
  );
  const possiblePoints = answers.reduce(
    (total, answer) => total + answer.points,
    0,
  );

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
            <Link href={`/admin/exams/${exam.id}`}>
              <ArrowLeft className="size-4" />
              Exam overview
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {candidate.candidateName}
            </h1>
            <Badge variant={attemptStatusVariant(candidate.status)}>
              {formatStatus(candidate.status)}
            </Badge>
            <Badge variant="outline">Demo data</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Candidate-level exam result, answer review, and release readiness
            for {exam.title}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="w-fit">
            <Mail className="size-4" />
            Email result
          </Button>
          <Button className="w-fit">
            <PencilLine className="size-4" />
            Review answers
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={User}
          label="Candidate"
          value={candidate.candidateName.split(" ")[0] ?? "Candidate"}
          note={candidate.candidateEmail}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Score"
          value={
            candidate.percentage === null ? "—" : `${Math.round(candidate.percentage)}%`
          }
          note={`${candidate.score ?? awardedPoints}/${exam.totalPoints || possiblePoints} points`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Manual review"
          value={`${pendingAnswers.length}`}
          note="Answers waiting for grading"
        />
        <MetricCard
          icon={Clock}
          label="Submitted"
          value={candidate.submittedAt ? "Submitted" : "Not submitted"}
          note={formatDateTime(candidate.submittedAt ?? candidate.startedAt)}
        />
      </div>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="text-lg">Result snapshot</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            The key candidate, timing, and release details for this exam.
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
              {formatDateTime(candidate.startedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Submitted
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {formatDateTime(candidate.submittedAt)}
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
              <CardTitle className="text-lg">Answer overview</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Fast scan of every answer and its grading state.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                {reviewedAnswers.length} reviewed
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                {pendingAnswers.length} pending
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <AnswersTable answers={answers} />
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="text-lg">Manual review workspace</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Written answers appear here for grading and feedback.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {answers.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              No submitted answers are available yet.
            </div>
          ) : pendingAnswers.length > 0 ? (
            pendingAnswers.map((answer) => (
              <AnswerReviewCard key={answer.id} answer={answer} />
            ))
          ) : (
            answers
              .filter(
                (answer) =>
                  answer.questionType === "short_text" ||
                  answer.questionType === "paragraph",
              )
              .map((answer) => (
                <AnswerReviewCard key={answer.id} answer={answer} />
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
