import { notFound } from "next/navigation";
import { ExamSetupWorkspace } from "@/components/admin/exam-setup-workspace";
import { getPlatformDefaults } from "@/lib/config/platform-defaults";
import { getAdminExamById } from "@/lib/dal/exams";
import { getAdminExamStepTwoData } from "@/lib/dal/exam-setup";

export default async function AdminExamSetupPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const [defaults, exam, stepTwoData] = await Promise.all([
    getPlatformDefaults(),
    getAdminExamById(examId),
    getAdminExamStepTwoData(examId),
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <ExamSetupWorkspace
      defaults={defaults}
      initialExam={exam}
      initialGroups={stepTwoData.groups}
      initialSummary={stepTwoData.summary}
    />
  );
}
