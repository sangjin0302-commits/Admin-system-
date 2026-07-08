import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Tool = {
  href: string;
  title: string;
  desc: string;
  flag: string;
  emoji: string;
};

const TOOLS: Tool[] = [
  {
    href: "/admin/mentor/case-simulator",
    title: "사례 시뮬레이터",
    desc: "AI가 실제 같은 상담 시나리오를 생성. 답변 → AI 채점 + 모범답안",
    flag: "mentor_case_simulator",
    emoji: "🎭",
  },
  {
    href: "/admin/mentor/document-critique",
    title: "서면 첨삭",
    desc: "본인 초안 붙여넣기 → AI가 rubric 기반 첨삭 + 개선안",
    flag: "mentor_document_critique",
    emoji: "✍️",
  },
  {
    href: "/admin/mentor/precedent-quiz",
    title: "판례 퀴즈",
    desc: "판례 사실관계 → 결론 예측 훈련. 정답률·약점 카테고리 추적",
    flag: "mentor_precedent_quiz",
    emoji: "🎯",
  },
  {
    href: "/admin/mentor/client-roleplay",
    title: "클라이언트 롤플레이",
    desc: "AI가 클라이언트 역할. 다양한 성격·감정 상태로 상담 훈련",
    flag: "mentor_client_roleplay",
    emoji: "💬",
  },
];

export default async function MentorHubPage() {
  if (!(await isFeatureEnabled("mentor_hub"))) notFound();
  const availability = await Promise.all(TOOLS.map((t) => isFeatureEnabled(t.flag)));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Mentoring"
        title="실무 연습 도구"
        description="AI 기반 행정사 실무 훈련. 안전한 환경에서 반복 연습 → 실전 자신감"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((t, i) => {
          const enabled = availability[i];
          return (
            <Card key={t.href} className={`p-5 ${enabled ? "" : "opacity-50"}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{t.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  <p className="text-sm text-text-muted mt-1">{t.desc}</p>
                  <div className="mt-3">
                    {enabled ? (
                      <Link href={t.href} className="text-sm font-medium text-blue-600 hover:underline">
                        시작 →
                      </Link>
                    ) : (
                      <span className="text-xs text-text-muted">
                        기능 비활성 (
                        <Link href="/admin/features" className="underline">
                          {t.flag}
                        </Link>
                        )
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
