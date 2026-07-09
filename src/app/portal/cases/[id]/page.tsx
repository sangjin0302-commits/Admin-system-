import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { PortalHeader } from "@/components/layout/portal-header";
import { CaseTimeline } from "@/components/public/case-timeline";
import { Gov24RequestCard } from "@/components/portal/gov24-request-card";
import { ModusignPendingCard } from "@/components/portal/modusign-pending-card";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { predictDuration } from "@/lib/services/duration-predictor-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function PortalCaseDetail({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/portal/signin");
  const userId = (session.user as { id?: string }).id;
  const client = userId ? await prisma.portalClient.findUnique({ where: { id: userId } }) : null;
  if (!client) redirect("/portal/signin");

  const { id } = await params;
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id },
    include: {
      inquiry: { select: { email: true, contactName: true, publicTrackingCode: true } },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      requiredDocuments: { select: { name: true, status: true, dueDate: true } }
    }
  });

  if (!caseMatter || caseMatter.inquiry?.email !== client.email) {
    notFound();
  }

  const uploads = await prisma.portalUploadedFile.findMany({
    where: { clientId: client.id },
    orderBy: { uploadedAt: "desc" },
    take: 20
  });

  const timelineLive = await isFeatureEnabled("portal_timeline_live").catch(() => false);
  const durationPrediction = await predictDuration(caseMatter.category, caseMatter.riskLevel).catch(() => null);
  const expectedCloseLabel = durationPrediction
    ? new Date(
        (caseMatter.openedAt ?? caseMatter.createdAt).getTime() +
          durationPrediction.p50Days * 24 * 3600 * 1000
      ).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader clientName={client.name} />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <Link href="/portal" className="text-xs text-text-muted hover:text-primary">
        ← 포털 대시보드
      </Link>

      <Card className="p-7">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">My Case</p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-primary">{caseMatter.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {caseMatter.caseNo ?? "-"} · 상태: {caseMatter.status}
        </p>
        {expectedCloseLabel && (
          <p className="mt-1 text-sm text-text-muted">예상 종결: {expectedCloseLabel}</p>
        )}
        {caseMatter.summary && (
          <p className="mt-4 rounded-lg bg-surface-muted/50 p-3 text-sm text-text">
            {caseMatter.summary}
          </p>
        )}
      </Card>

      {/* 진행 단계 타임라인 */}
      <CaseTimeline status={caseMatter.status} caseId={caseMatter.id} liveEnabled={timelineLive} />
      <Gov24RequestCard caseId={caseMatter.id} />
      <ModusignPendingCard caseId={caseMatter.id} />

      {/* 필요 자료 */}
      <Card className="p-7">
        <h2 className="font-serif text-lg font-bold text-primary">필요 자료</h2>
        {caseMatter.requiredDocuments.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">현재 안내된 필요 자료가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {caseMatter.requiredDocuments.map((d, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-gold/20 px-3 py-2 text-sm">
                <span>{d.name}</span>
                <span className="text-xs text-text-muted">{d.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/portal/upload"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-text-strong"
        >
          자료 업로드
        </Link>
      </Card>

      {/* 업로드한 자료 */}
      <Card className="p-7">
        <h2 className="font-serif text-lg font-bold text-primary">내가 업로드한 자료</h2>
        {uploads.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">업로드한 자료가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg border border-gold/20 px-3 py-2">
                <span>{u.fileName}</span>
                <span className="text-xs text-text-muted">
                  {new Date(u.uploadedAt).toLocaleDateString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 진행 이벤트 */}
      <Card className="p-7">
        <h2 className="font-serif text-lg font-bold text-primary">진행 이력</h2>
        {caseMatter.events.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">진행 이력이 없습니다.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {caseMatter.events.map((ev) => (
              <li key={ev.id} className="border-l-2 border-gold/40 pl-4">
                <p className="text-xs text-text-muted">
                  {new Date(ev.createdAt).toLocaleString("ko-KR")} · {ev.eventType}
                </p>
                <p className="mt-1 text-sm text-text">{ev.message}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
      </div>
    </div>
  );
}
