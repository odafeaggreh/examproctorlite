import { render } from "react-email";
import { ExamAccessCodeEmail } from "@/lib/email/templates/exam-access-code-email";

type BuildExamAccessCodeEmailOptions = {
  examTitle: string;
  accessCode: string;
};

export async function buildExamAccessCodeEmail({
  examTitle,
  accessCode,
}: BuildExamAccessCodeEmailOptions) {
  const appUrl = "https://examproctolite.online";
  const element = (
    <ExamAccessCodeEmail
      examTitle={examTitle}
      accessCode={accessCode}
      appUrl={appUrl}
    />
  );
  const html = await render(element);
  const text = await render(element, { plainText: true });

  return {
    subject: `Access code for ${examTitle}`,
    html,
    text,
  };
}
