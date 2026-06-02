"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Loader2,
  MoreVertical,
  PencilLine,
  Rocket,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ExamListItemDTO } from "@/lib/dto/exams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format/date";

function statusVariant(status: ExamListItemDTO["status"]) {
  switch (status) {
    case "published":
      return "success";
    case "archived":
      return "outline";
    default:
      return "warning";
  }
}

function formatQuestionSummary(exam: ExamListItemDTO) {
  return `${exam.questionCount} question${
    exam.questionCount === 1 ? "" : "s"
  } · ${exam.totalPoints} point${exam.totalPoints === 1 ? "" : "s"}`;
}

function ExamActionsMenu({
  exam,
  isUpdating,
  onStatusChange,
}: {
  exam: ExamListItemDTO;
  isUpdating: boolean;
  onStatusChange: (examId: string, status: ExamListItemDTO["status"]) => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          aria-label={`More actions for ${exam.title}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2">
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
          <Link href={`/admin/exams/${exam.id}`}>
            <Settings2 className="h-4 w-4" />
            Open setup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
          <Link href={`/admin/exams/${exam.id}/edit`}>
            <PencilLine className="h-4 w-4" />
            Edit details
          </Link>
        </DropdownMenuItem>

        {exam.status === "published" ? (
          <>
            <DropdownMenuItem
              onClick={() => onStatusChange(exam.id, "draft")}
              disabled={isUpdating}
              className="rounded-xl px-3 py-2"
            >
              <RotateCcw className="h-4 w-4" />
              Unpublish
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusChange(exam.id, "archived")}
              disabled={isUpdating}
              variant="destructive"
              className="rounded-xl px-3 py-2"
            >
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </>
        ) : null}

        {exam.status === "archived" ? (
          <DropdownMenuItem
            onClick={() => onStatusChange(exam.id, "draft")}
            disabled={isUpdating}
            className="rounded-xl px-3 py-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restore to draft
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PrimaryExamAction({
  exam,
  isUpdating,
  onPublish,
}: {
  exam: ExamListItemDTO;
  isUpdating: boolean;
  onPublish: (examId: string) => void;
}) {
  if (exam.status === "draft") {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onPublish(exam.id)}
        disabled={isUpdating}
        className="gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        Publish
      </Button>
    );
  }

  if (exam.status === "published") {
    return (
      <Button asChild size="sm" variant="outline" className="gap-2 rounded-full">
        <Link href={`/admin/exams/${exam.id}/results`}>
          <Trophy className="h-4 w-4" />
          Review results
        </Link>
      </Button>
    );
  }

  return null;
}

export function ExamsOverview({
  initialExams,
}: {
  initialExams: ExamListItemDTO[];
}) {
  const [query, setQuery] = useState("");
  const [exams, setExams] = useState(initialExams);
  const [userLocale, setUserLocale] = useState<string>();
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [updatingExamId, setUpdatingExamId] = useState<string | null>(null);
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setUserLocale(navigator.languages?.[0] || navigator.language);
  }, []);

  const filteredExams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return exams;
    }

    return exams.filter((exam) => {
      return (
        exam.title.toLowerCase().includes(normalizedQuery) ||
        exam.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [exams, query]);

  function updatePublicationStatus(
    examId: string,
    status: ExamListItemDTO["status"],
  ) {
    setPublicationError(null);
    setUpdatingExamId(examId);

    startUpdatingStatus(async () => {
      try {
        const response = await fetch(`/api/admin/exams/${examId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const payload = (await response.json()) as {
          exam?: ExamListItemDTO;
          error?: string;
        };

        if (!response.ok || !payload.exam) {
          throw new Error(
            payload.error ?? "Could not update this exam status.",
          );
        }

        setExams((current) =>
          current.map((exam) => (exam.id === examId ? payload.exam! : exam)),
        );
      } catch (error) {
        setPublicationError(
          error instanceof Error
            ? error.message
            : "Could not update this exam status.",
        );
      } finally {
        setUpdatingExamId(null);
      }
    });
  }

  const columns = useMemo<ColumnDef<ExamListItemDTO>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Exam",
        cell: ({ row }) => {
          const exam = row.original;

          return (
            <div className="min-w-[260px] max-w-md">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
                >
                  {exam.title}
                </Link>
                <Badge
                  variant={statusVariant(exam.status)}
                  className="capitalize"
                >
                  {exam.status}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {exam.description || "No description yet."}
              </p>
            </div>
          );
        },
      },
      {
        id: "schedule",
        header: "Schedule",
        cell: ({ row }) => {
          const exam = row.original;

          return (
            <div className="min-w-[190px] space-y-1 text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {formatDateTime(exam.startAt, userLocale) || "Not scheduled"}
              </div>
              <p className="pl-6 text-xs text-slate-500">
                {formatDateTime(exam.endAt, userLocale)
                  ? `Ends ${formatDateTime(exam.endAt, userLocale)}`
                  : "No end time"}
              </p>
            </div>
          );
        },
      },
      {
        id: "questions",
        header: "Questions",
        cell: ({ row }) => (
          <div className="min-w-[130px]">
            <p className="font-semibold text-slate-900">
              {row.original.questionCount}
            </p>
            <p className="text-xs text-slate-500">
              {row.original.totalPoints} point
              {row.original.totalPoints === 1 ? "" : "s"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="min-w-[140px] space-y-1">
            <Badge variant={statusVariant(row.original.status)} className="capitalize">
              {row.original.status}
            </Badge>
            <p className="text-xs text-slate-500 capitalize">
              {row.original.resultReleaseMode.replaceAll("_", " ")}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const exam = row.original;
          const isUpdating =
            isUpdatingStatus && updatingExamId === row.original.id;

          return (
            <div className="flex min-w-[190px] items-center justify-end gap-2">
              <PrimaryExamAction
                exam={exam}
                isUpdating={isUpdating}
                onPublish={(examId) =>
                  updatePublicationStatus(examId, "published")
                }
              />
              <ExamActionsMenu
                exam={exam}
                isUpdating={isUpdating}
                onStatusChange={updatePublicationStatus}
              />
            </div>
          );
        },
      },
    ],
    [isUpdatingStatus, updatingExamId, userLocale],
  );
  const table = useReactTable({
    data: filteredExams,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-full min-w-0 overflow-hidden rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
        <CardHeader className="flex-col gap-6 border-b border-slate-100 bg-white/90 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-[1.25rem] tracking-[-0.01em] text-slate-900">
              Your exams
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm text-slate-500">
              See the essentials for every exam, then jump into the next action
              without clutter.
            </CardDescription>
          </div>
          <Button
            asChild
            className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Link href="/admin/exams/create">
              <Sparkles className="h-4 w-4" />
              Create exam
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="w-full max-w-full min-w-0 space-y-6 overflow-hidden bg-slate-50/40 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl border-slate-200 bg-white pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by exam name"
                value={query}
              />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {filteredExams.length} exam{filteredExams.length === 1 ? "" : "s"}
            </p>
          </div>

          {publicationError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {publicationError}
            </div>
          ) : null}

          <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)] md:block">
            <Table className="w-max min-w-[920px]">
              <TableHeader className="bg-slate-50/70">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-slate-100 hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-slate-400"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-slate-100 hover:bg-slate-50/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-6 py-4 align-middle"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No exams to show yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredExams.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
                No exams to show yet. Create one to get started.
              </div>
            ) : (
              filteredExams.map((exam) => {
                const isUpdating = isUpdatingStatus && updatingExamId === exam.id;

                return (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02),_0_1px_2px_rgba(0,0,0,0.01)] transition-colors hover:bg-slate-50/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="block truncate font-semibold leading-snug text-slate-900"
                        >
                          {exam.title}
                        </Link>
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {exam.description || "No description yet."}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant(exam.status)}
                        className="shrink-0 capitalize"
                      >
                        {exam.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-slate-50 pt-4 text-xs text-slate-600">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Schedule
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateTime(exam.startAt, userLocale) ||
                            "Not scheduled"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Questions
                          </span>
                          <p className="mt-1 font-medium text-slate-700">
                            {formatQuestionSummary(exam)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Results
                          </span>
                          <p className="mt-1 capitalize text-slate-700">
                            {exam.resultReleaseMode.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-50 pt-4">
                      <PrimaryExamAction
                        exam={exam}
                        isUpdating={isUpdating}
                        onPublish={(examId) =>
                          updatePublicationStatus(examId, "published")
                        }
                      />
                      <ExamActionsMenu
                        exam={exam}
                        isUpdating={isUpdating}
                        onStatusChange={updatePublicationStatus}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
