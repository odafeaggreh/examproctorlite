import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function CandidateMetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-none">
      <CardContent className="flex min-w-0 items-start gap-4 p-5">
        <div className="shrink-0 rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 break-words text-sm text-slate-500">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
