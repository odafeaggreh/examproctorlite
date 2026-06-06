"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import type {
  AdminCandidate,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import { CandidateActionsMenu } from "@/components/admin/candidates/candidate-actions-menu";
import { CandidateStatusBadge } from "@/components/admin/candidates/candidate-badges";
import { CandidateIdentity } from "@/components/admin/candidates/candidate-identity";
import { CandidateMobileCard } from "@/components/admin/candidates/candidate-mobile-card";
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
} from "@/lib/format/candidates";

export function CandidatesRosterTable({
  candidates,
  onStatusChange,
  updatingCandidateId,
}: {
  candidates: AdminCandidate[];
  onStatusChange: (uid: string, status: CandidateRosterStatus) => Promise<void>;
  updatingCandidateId: string | null;
}) {
  const columns = useMemo<ColumnDef<AdminCandidate>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => <CandidateIdentity candidate={row.original} />,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="block min-w-[220px] text-sm text-slate-600">
            {row.original.email}
          </span>
        ),
      },
      {
        id: "exams",
        header: "Exams",
        cell: ({ row }) => {
          const { assigned, taken, completed } = row.original.examStats;

          return (
            <div className="min-w-[150px]">
              <p className="font-semibold text-slate-900">
                {completed}/{assigned}
              </p>
              <p className="text-xs text-slate-500">
                {taken} taken · {assigned} assigned
              </p>
            </div>
          );
        },
      },
      {
        id: "averageScore",
        header: "Average score",
        cell: ({ row }) => (
          <div className="min-w-[120px]">
            <p className="font-semibold text-slate-900">
              {formatCandidateScore(row.original.examStats.averageScore)}
            </p>
            <p className="text-xs text-slate-500">Across completed exams</p>
          </div>
        ),
      },
      {
        id: "manualReview",
        header: "Manual review",
        cell: ({ row }) => {
          const count = row.original.examStats.pendingManualReviews;

          return count > 0 ? (
            <span className="inline-flex min-w-[130px] items-center gap-2 text-sm font-medium text-amber-700">
              {count} pending
            </span>
          ) : (
            <span className="inline-flex min-w-[130px] items-center gap-2 text-sm font-medium text-emerald-700">
              Clear
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <CandidateStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex min-w-[56px] justify-end">
            <CandidateActionsMenu
              candidate={row.original}
              onStatusChange={onStatusChange}
              isUpdating={updatingCandidateId === row.original.uid}
            />
          </div>
        ),
      },
    ],
    [onStatusChange, updatingCandidateId],
  );

  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)] md:block">
        <Table className="w-max min-w-[1060px]">
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
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 md:hidden">
        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
            No candidates found.
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateMobileCard
              key={candidate.uid}
              candidate={candidate}
              onStatusChange={onStatusChange}
              isUpdating={updatingCandidateId === candidate.uid}
            />
          ))
        )}
      </div>
    </>
  );
}
