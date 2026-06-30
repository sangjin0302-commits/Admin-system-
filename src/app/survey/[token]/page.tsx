import { prisma } from "@/lib/prisma/client";
import { SurveyForm } from "@/components/public/survey-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ETHOS 만족도 조사",
};

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const survey = await prisma.satisfactionSurvey.findUnique({
    where: { token },
    select: { id: true, status: true, clientName: true, token: true },
  });

  if (!survey) return notFound();

  if (survey.status === "COMPLETED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">이미 응답하셨습니다</h1>
          <p className="text-gray-600">소중한 의견에 감사드립니다.</p>
        </div>
      </div>
    );
  }

  if (survey.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">설문이 만료되었습니다</h1>
          <p className="text-gray-600">이 설문 링크는 더 이상 유효하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return <SurveyForm token={survey.token} clientName={survey.clientName} />;
}
