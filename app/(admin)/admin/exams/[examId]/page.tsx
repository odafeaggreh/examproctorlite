import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileQuestion,
  MailCheck,
  Pencil,
  Users,
} from "lucide-react";

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
import { getAdminExamOverview } from "@/lib/dal/exam-overview";
import type { ExamCandidateResultDTO } from "@/lib/dto/exam-results";
import type {
  ExamAttemptStatus,
  ExamStatus,
  ResultReleaseMode,
} from "@/lib/types/exam-management";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatScore(score: number | null, totalPoints: number) {
  if (score === null) {
    return "—";
  }

  if (totalPoints > 0) {
    return `${Math.round(score * 10) / 10}/${totalPoints}`;
  }

  return `${Math.round(score * 10) / 10}`;
}

function formatPercentage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)}%`;
}

function formatReleaseMode(value: ResultReleaseMode) {
  switch (value) {
    case "auto_release_on_submission":
      return "Auto release";
    case "release_after_review":
      return "After review";
    default:
      return "Manual release";
  }
}

function statusLabel(status: ExamStatus | ExamAttemptStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function examStatusVariant(status: ExamStatus) {
  if (status === "published") {
    return "success" as const;
  }

  if (status === "draft") {
    return "warning" as const;
  }

  return "outline" as const;
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

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function CandidateTable({
  examId,
  candidates,
  totalPoints,
}: {
  examId: string;
  candidates: ExamCandidateResultDTO[];
  totalPoints: number;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400">
          <Users className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">
          No attempts yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Candidate results will appear here once students start or submit this
          exam.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
      <Table className="min-w-[860px]">
        <TableHeader className="bg-slate-50/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Candidate
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Status
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Score
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Manual review
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Submitted
            </TableHead>
            <TableHead className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="px-5 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/candidates/${candidate.candidateId}/exams/${examId}`}
                    className="font-medium text-slate-950 transition-colors hover:text-blue-600"
                  >
                    {candidate.candidateName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {candidate.candidateEmail}
                  </p>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4">
                <Badge
                  variant={attemptStatusVariant(candidate.status)}
                  className="font-medium"
                >
                  {statusLabel(candidate.status)}
                </Badge>
              </TableCell>
              <TableCell className="px-5 py-4">
                <div className="font-medium text-slate-950">
                  {formatScore(candidate.score, totalPoints)}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {formatPercentage(candidate.percentage)}
                </div>
              </TableCell>
              <TableCell className="px-5 py-4">
                {candidate.requiresManualReview ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                    <AlertTriangle className="size-4" />
                    Needed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Clear
                  </span>
                )}
              </TableCell>
              <TableCell className="px-5 py-4 text-sm text-slate-600">
                {formatDateTime(candidate.submittedAt)}
              </TableCell>
              <TableCell className="px-5 py-4 text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/candidates/${candidate.candidateId}/exams/${examId}`}
                  >
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminExamOverviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const overview = await getAdminExamOverview(examId);

  if (!overview) {
    notFound();
  }

  const {
    exam,
    assignmentSummary,
    resultSummary,
    candidates,
    isUsingDummyResults,
  } = overview;
  const accessCode = assignmentSummary.sharedAccessCode?.code ?? "Not created";
  const totalCandidates = Math.max(
    assignmentSummary.totalReachableCandidates,
    candidates.length,
  );
  const passRate =
    resultSummary.completedAttempts > 0
      ? `${Math.round(
          (resultSummary.passCount / resultSummary.completedAttempts) * 100,
        )}%`
      : "—";

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
            <Link href="/admin/exams">
              <ArrowLeft className="size-4" />
              Exams
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {exam.title}
            </h1>
            <Badge variant={examStatusVariant(exam.status)}>
              {statusLabel(exam.status)}
            </Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {exam.description ||
              "Monitor candidate progress, scores, and review needs for this exam."}
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href={`/admin/exams/${exam.id}/edit`}>
            <Pencil className="size-4" />
            Edit exam
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total candidates"
          value={`${totalCandidates}`}
          note="Linked or reachable for this exam"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed attempts"
          value={`${resultSummary.completedAttempts}`}
          note={`${resultSummary.totalAttempts} total started`}
        />
        <MetricCard
          icon={BarChart3}
          label="Average score"
          value={formatPercentage(resultSummary.averagePercentage)}
          note={
            resultSummary.averageScore === null
              ? "No scored attempts yet"
              : `${Math.round(resultSummary.averageScore * 10) / 10} average points`
          }
        />
        <MetricCard
          icon={AlertTriangle}
          label="Manual review"
          value={`${resultSummary.pendingManualReviews}`}
          note="Answers waiting for admin review"
        />
      </div>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Exam snapshot</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Key setup details admins need before reviewing results.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Access code: {accessCode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Schedule"
            value={`${formatDateTime(exam.startAt)} → ${formatDateTime(
              exam.endAt,
            )}`}
          />
          <DetailItem
            label="Questions"
            value={`${exam.questionCount} questions · ${exam.totalPoints} points`}
          />
          <DetailItem
            label="Pass mark"
            value={`${exam.passMark}% · ${passRate} pass rate`}
          />
          <DetailItem
            label="Release"
            value={formatReleaseMode(exam.resultReleaseMode)}
          />
          <DetailItem
            label="Duration"
            value={`${exam.durationMinutes} minutes`}
          />
          <DetailItem label="Timezone" value={exam.timezone} />
          <DetailItem
            label="Review rule"
            value={
              exam.hasManualReviewQuestions
                ? "Manual review required"
                : "Objective scoring only"
            }
          />
          <DetailItem
            label="Access"
            value={
              assignmentSummary.hasSharedAccessCode
                ? `${assignmentSummary.sharedAccessCode?.usedCount ?? 0} code uses`
                : "No active shared code"
            }
          />
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Candidate results</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Scores and review status for candidates who have started this
                exam.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              {isUsingDummyResults ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700">
                  Demo data
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                Exam-scoped candidates
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                <Clock className="size-4" />
                {resultSummary.totalAttempts} started
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                <MailCheck className="size-4" />
                {candidates.filter((candidate) => candidate.emailSent).length}{" "}
                emailed
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                <FileQuestion className="size-4" />
                {exam.questionCount} questions
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                <CalendarClock className="size-4" />
                {formatDateTime(exam.startAt)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <CandidateTable
            examId={exam.id}
            candidates={candidates}
            totalPoints={exam.totalPoints}
          />
        </CardContent>
      </Card>
    </div>
  );
}
