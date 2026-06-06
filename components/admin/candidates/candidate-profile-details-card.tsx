import type { AdminCandidate } from "@/lib/types/exam-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format/date";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function CandidateProfileDetailsCard({
  candidate,
}: {
  candidate: AdminCandidate;
}) {
  return (
    <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-none">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="text-lg">Profile details</CardTitle>
        <p className="mt-1 text-sm text-slate-500">
          Basic account information for this candidate.
        </p>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="User ID" value={candidate.uid} />
        <DetailItem label="Email" value={candidate.email} />
        <DetailItem
          label="Created"
          value={formatDateTime(candidate.createdAt) ?? "Not set"}
        />
        <DetailItem
          label="Last updated"
          value={formatDateTime(candidate.updatedAt) ?? "Not set"}
        />
      </CardContent>
    </Card>
  );
}
