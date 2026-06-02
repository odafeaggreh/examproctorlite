import { ExamsOverview } from "@/components/admin/exams-overview";
import { getAdminExamList } from "@/lib/dal/exams";

export default async function AdminExamsPage() {
  const exams = await getAdminExamList();

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create exams, update details, and keep track of what is ready to
          share with students.
        </p>
      </div>

      <ExamsOverview initialExams={exams} />
    </div>
  );
}
