import { ExamSheetWorkflow } from "@/components/admin/exam-sheet-workflow";
import { getPlatformDefaults } from "@/lib/config/platform-defaults";

export default async function CreateExamPage() {
  const defaults = await getPlatformDefaults();

  return (
    <div className="min-h-full bg-slate-50/60">
      <ExamSheetWorkflow
        mode="create"
        defaults={defaults}
      />
    </div>
  );
}
