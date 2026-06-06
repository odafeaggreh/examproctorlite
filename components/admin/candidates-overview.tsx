"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import type {
  AdminCandidate,
  CandidateRosterStatus,
} from "@/lib/types/exam-management";
import { CandidatesRosterTable } from "@/components/admin/candidates/candidates-roster-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CandidatesOverview({
  initialCandidates,
}: {
  initialCandidates: AdminCandidate[];
}) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState(initialCandidates);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      return (
        candidate.name.toLowerCase().includes(normalizedQuery) ||
        candidate.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [candidates, query]);

  function updateCandidateStatus(uid: string, status: CandidateRosterStatus) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.uid === uid ? { ...candidate, status } : candidate,
      ),
    );
  }

  return (
    <Card className="w-full max-w-full min-w-0 overflow-hidden rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
      <CardHeader className="border-b border-slate-100 bg-white/90 p-5 sm:p-6">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Users className="h-5 w-5" />
        </div>
        <CardTitle className="text-[1.25rem] tracking-[-0.01em] text-slate-900">
          Candidate roster
        </CardTitle>
        <CardDescription className="mt-2 max-w-2xl text-sm text-slate-500">
          Review student profiles, exam progress, and account status without
          crowding the table.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-full min-w-0 space-y-6 overflow-hidden bg-slate-50/40 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl border-slate-200 bg-white pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
              value={query}
            />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {filteredCandidates.length} candidate
            {filteredCandidates.length === 1 ? "" : "s"}
          </p>
        </div>

        <CandidatesRosterTable
          candidates={filteredCandidates}
          onStatusChange={updateCandidateStatus}
        />
      </CardContent>
    </Card>
  );
}
