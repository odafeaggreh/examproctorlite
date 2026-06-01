"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  Rocket,
  Search,
  Sparkles,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

export function ExamsOverview({
  initialExams,
}: {
  initialExams: ExamListItemDTO[];
}) {
  const [query, setQuery] = useState("");
  const [exams, setExams] = useState(initialExams);
  const [userLocale, setUserLocale] = useState<string>();
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [publishingExamId, setPublishingExamId] = useState<string | null>(null);
  const [isPublishing, startPublishing] = useTransition();

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

  function publishExam(examId: string) {
    setPublicationError(null);
    setPublishingExamId(examId);

    startPublishing(async () => {
      try {
        const response = await fetch(`/api/admin/exams/${examId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
        const payload = (await response.json()) as {
          exam?: ExamListItemDTO;
          error?: string;
        };

        if (!response.ok || !payload.exam) {
          throw new Error(payload.error ?? "Could not publish this exam.");
        }

        setExams((current) =>
          current.map((exam) => (exam.id === examId ? payload.exam! : exam)),
        );
      } catch (error) {
        setPublicationError(
          error instanceof Error ? error.message : "Could not publish this exam.",
        );
      } finally {
        setPublishingExamId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
        <CardHeader className="gap-6 border-b border-slate-100 bg-white/90 flex-col sm:flex-row sm:items-end sm:justify-between p-5 sm:p-6">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-[1.25rem] tracking-[-0.01em] text-slate-900">
              Your exams
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm text-slate-500">
              See every exam in one place, search quickly, and jump into edits
              whenever something needs updating.
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
        <CardContent className="space-y-6 bg-slate-50/40 p-4 sm:p-6">
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

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-[20px] border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70 text-left text-slate-400">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em]">
                    Exam
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em]">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em]">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em]">
                    Results
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-slate-500"
                      colSpan={5}
                    >
                      No exams to show yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((exam) => (
                    <tr
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                      key={exam.id}
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-slate-900">
                          {exam.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-slate-500">
                          {exam.description || "No description yet."}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Badge variant={statusVariant(exam.status)}>
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          {exam.durationMinutes} mins
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1 text-slate-500">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {formatDateTime(exam.startAt, userLocale) ||
                              "Not scheduled"}
                          </div>
                          <div>
                            {formatDateTime(exam.endAt, userLocale) ||
                              "No end time"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="capitalize">
                            {exam.resultReleaseMode.replaceAll("_", " ")}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/exams/${exam.id}`}>
                                Open setup
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/exams/${exam.id}/edit`}>
                                Edit exam
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            {exam.status === "draft" ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => publishExam(exam.id)}
                                disabled={
                                  isPublishing && publishingExamId === exam.id
                                }
                                className="gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              >
                                {isPublishing && publishingExamId === exam.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Rocket className="h-4 w-4" />
                                )}
                                Publish
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="space-y-4 md:hidden">
            {filteredExams.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
                No exams to show yet. Create one to get started.
              </div>
            ) : (
              filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02),_0_1px_2px_rgba(0,0,0,0.01)] transition-colors hover:bg-slate-50/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900 leading-snug">
                        {exam.title}
                      </h3>
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

                  <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-50 pt-4 text-xs text-slate-600">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Duration
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        {exam.durationMinutes} mins
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Results
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 capitalize">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {exam.resultReleaseMode.replaceAll("_", " ")}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Schedule
                      </span>
                      <div className="space-y-1 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {formatDateTime(exam.startAt, userLocale) ||
                              "Not scheduled"}
                          </span>
                        </div>
                        {exam.endAt && (
                          <div className="pl-5 text-slate-500">
                            to {formatDateTime(exam.endAt, userLocale)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-50 pt-4 flex justify-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/exams/${exam.id}`}>
                          Open setup
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          Edit exam
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      {exam.status === "draft" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => publishExam(exam.id)}
                          disabled={isPublishing && publishingExamId === exam.id}
                          className="gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {isPublishing && publishingExamId === exam.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Rocket className="h-4 w-4" />
                          )}
                          Publish
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
