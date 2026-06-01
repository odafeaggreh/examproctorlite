import { notFound } from "next/navigation";
import { ExamSheetWorkflow } from "@/components/admin/exam-sheet-workflow";
import { getPlatformDefaults } from "@/lib/config/platform-defaults";
import { getAdminExamById, getAdminExamQuestions } from "@/lib/dal/exams";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const [defaults, exam, questions] = await Promise.all([
    getPlatformDefaults(),
    getAdminExamById(examId),
    getAdminExamQuestions(examId),
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <div className="min-h-full bg-slate-50/60">
      <ExamSheetWorkflow
        mode="edit"
        defaults={defaults}
        exam={exam}
        initialQuestions={questions}
      />
    </div>
  );
}
