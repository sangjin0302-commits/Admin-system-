import { getSurveyByToken } from "@/lib/services/satisfaction-survey-service";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const survey = await getSurveyByToken(token);
  if (!survey) notFound();
  if (survey.submittedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="rounded-2xl border p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-primary">감사합니다!</p>
          <p className="mt-2 text-sm text-text-muted">이미 평가를 완료하셨습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <SurveyForm token={token} />
    </div>
  );
}
