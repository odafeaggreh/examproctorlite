import { CandidatesOverview } from "@/components/admin/candidates-overview";
import { getAdminCandidates } from "@/lib/dal/candidates";

export default async function AdminCandidatesPage() {
  const candidates = await getAdminCandidates();

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Manage student profiles, account status, and exam progress from one
          focused roster.
        </p>
      </div>

      <CandidatesOverview initialCandidates={candidates} />
    </div>
  );
}
