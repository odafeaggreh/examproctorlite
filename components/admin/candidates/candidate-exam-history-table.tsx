import Link from "next/link";

import type { AdminCandidate } from "@/lib/types/exam-management";
import { CandidateExamStatusBadge } from "@/components/admin/candidates/candidate-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCandidateScore,
  getAdminCandidateExamHref,
} from "@/lib/format/candidates";
import { formatDateTime } from "@/lib/format/date";

export function CandidateExamHistoryTable({
  candidate,
}: {
  candidate: AdminCandidate;
}) {
  return (
    <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="text-lg">Exam history</CardTitle>
        <p className="mt-1 text-sm text-slate-500">
          Exams linked to this candidate and their latest result state.
        </p>
      </CardHeader>
      <CardContent className="p-5">
        {candidate.examHistory.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
            No exam history yet.
          </div>
        ) : (
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Exam
                  </TableHead>
                  <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Score
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
                {candidate.examHistory.map((exam) => (
                  <TableRow key={exam.examId}>
                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-slate-950">
                        {exam.examTitle}
                      </p>
                      {exam.requiresManualReview ? (
                        <p className="mt-1 text-xs text-amber-700">
                          Manual review needed
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <CandidateExamStatusBadge status={exam.status} />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-slate-900">
                      {formatCandidateScore(exam.percentage)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-slate-600">
                      {formatDateTime(exam.submittedAt) ?? "Not set"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={getAdminCandidateExamHref({
                            candidateId: candidate.uid,
                            examId: exam.examId,
                          })}
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
        )}
      </CardContent>
    </Card>
  );
}
