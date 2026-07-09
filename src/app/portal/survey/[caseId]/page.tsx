import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { SurveyForm } from "./survey-form";

export const dynamic = "force-dynamic";

const SETTING_PREFIX = "portal.survey.";

export default async function PortalSurveyPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const enabled = await isFeatureEnabled("portal_survey_page");
  if (!enabled) notFound();

  const { caseId } = await params;
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: { id: true, caseNo: true, title: true, closedAt: true },
  });
  if (!caseMatter) notFound();

  const existing = await prisma.siteSetting.findUnique({
    where: { key: `${SETTING_PREFIX}${caseId}` },
  });
  const alreadySubmitted = !!existing?.value;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link href="/portal" className="text-xs text-text-muted hover:text-primary">
          ← 포털 홈
        </Link>

        <div className="mt-6 rounded-2xl border border-gold/20 bg-surface p-7">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">
            Satisfaction Survey
          </p>
          <h1 className="mt-3 font-serif text-2xl font-bold text-primary">
            사건 만족도 설문
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            사건번호: {caseMatter.caseNo ?? "-"}
            {caseMatter.closedAt && (
              <>
                {" · "}종결일: {new Date(caseMatter.closedAt).toLocaleDateString("ko-KR")}
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-text-muted">{caseMatter.title}</p>

          <div className="mt-6">
            {alreadySubmitted ? (
              <div className="rounded-lg border border-gold/30 bg-surface-muted/40 p-4 text-sm text-text">
                이미 설문에 응답해 주셨습니다. 감사합니다.
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-text-strong"
                  >
                    홈으로 돌아가기
                  </Link>
                </div>
              </div>
            ) : (
              <SurveyForm caseId={caseMatter.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
