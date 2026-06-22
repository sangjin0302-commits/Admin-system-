import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalHeader } from "@/components/layout/portal-header";
import { auth, signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  INTAKE_REVIEW: "접수 검토",
  CONSULTING: "상담 중",
  QUOTED: "견적 안내",
  CONTRACT_PENDING: "계약 준비",
  OPEN: "진행 중",
  DOCUMENT_COLLECTING: "자료 수집",
  DOCUMENT_REVIEWING: "자료 검토",
  READY_TO_SUBMIT: "제출 준비",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  WAITING_AGENCY: "기관 처리 대기",
  RESULT_RECEIVED: "결과 통보",
  CLOSING: "마무리",
  CLOSED: "종결",
  CANCELLED: "취소",
  ON_HOLD: "보류"
};

// 상태별 대략적 진행률 (0~100)
const STATUS_PROGRESS: Record<string, number> = {
  INTAKE_REVIEW: 8,
  CONSULTING: 16,
  QUOTED: 24,
  CONTRACT_PENDING: 32,
  OPEN: 40,
  DOCUMENT_COLLECTING: 52,
  DOCUMENT_REVIEWING: 62,
  READY_TO_SUBMIT: 72,
  SUBMITTED: 80,
  SUPPLEMENT_REQUESTED: 76,
  WAITING_AGENCY: 88,
  RESULT_RECEIVED: 94,
  CLOSING: 97,
  CLOSED: 100,
  CANCELLED: 100,
  ON_HOLD: 40
};

// 상태별 의뢰인이 할 일 안내
const STATUS_NEXT_STEP: Record<string, string> = {
  INTAKE_REVIEW: "사무소에서 접수 내용을 검토 중입니다. 별도 조치는 없습니다.",
  CONSULTING: "상담이 진행 중입니다. 궁금한 점은 메시지로 남겨 주세요.",
  QUOTED: "견적을 확인하시고 진행 의사를 알려 주세요.",
  CONTRACT_PENDING: "계약 절차를 준비 중입니다. 안내를 기다려 주세요.",
  OPEN: "사건이 개시되었습니다. 요청되는 자료를 준비해 주세요.",
  DOCUMENT_COLLECTING: "필요 자료를 업로드해 주세요. (자료 업로드 버튼)",
  DOCUMENT_REVIEWING: "제출하신 자료를 검토 중입니다.",
  READY_TO_SUBMIT: "제출 준비가 끝났습니다. 최종 확인 후 제출 예정입니다.",
  SUBMITTED: "기관에 제출되었습니다. 결과를 기다리는 단계입니다.",
  SUPPLEMENT_REQUESTED: "보완 요청이 있습니다. 추가 자료를 확인·업로드해 주세요.",
  WAITING_AGENCY: "기관 처리를 기다리는 중입니다.",
  RESULT_RECEIVED: "결과가 통보되었습니다. 후속 안내를 확인해 주세요.",
  CLOSING: "마무리 단계입니다.",
  CLOSED: "종결된 사건입니다.",
  CANCELLED: "취소된 사건입니다.",
  ON_HOLD: "보류 중입니다. 담당자 안내를 기다려 주세요."
};

const CATEGORY_LABEL: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가",
  OTHER: "기타"
};

export default async function PortalDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/portal/signin");

  const userId = (session.user as { id?: string }).id;
  const client = userId
    ? await prisma.portalClient.findUnique({
        where: { id: userId },
        include: { uploadedFiles: { orderBy: { uploadedAt: "desc" }, take: 10 } }
      })
    : null;

  const inquiries = client
    ? await prisma.inquiry.findMany({
        where: { email: client.email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          publicTrackingCode: true,
          caseMatters: {
            select: { id: true, caseNo: true, title: true, status: true, category: true }
          }
        },
        take: 20
      })
    : [];

  const allCases = inquiries.flatMap((i) => i.caseMatters);
  const caseIds = allCases.map((c) => c.id);

  const [clientPayments, clientInvoices, clientSignatures] = caseIds.length
    ? await Promise.all([
        prisma.payment
          .findMany({
            where: { caseId: { in: caseIds } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
          .catch(() => []),
        prisma.taxInvoice
          .findMany({
            where: { caseId: { in: caseIds } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
          .catch(() => []),
        prisma.eSignRequest
          .findMany({
            where: { caseId: { in: caseIds } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
          .catch(() => []),
      ])
    : [[], [], []];

  const totalPaid = clientPayments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingSignatures = clientSignatures.filter((s) => s.status === "PENDING");

  const unreadCount = userId
    ? await prisma.portalNotification.count({ where: { clientId: userId, readAt: null } }).catch(() => 0)
    : 0;

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader clientName={client?.name} />

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        {/* 인사 */}
        <section className="ethos-card ethos-grain relative overflow-hidden p-8 sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/8" />
          <p className="ethos-eyebrow relative">Welcome</p>
          <h1 className="ethos-display relative mt-3 text-3xl sm:text-4xl">
            {client?.name}님, 안녕하세요
          </h1>
          <p className="relative mt-2 text-sm text-text-muted">{client?.email}</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal/upload"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition hover:bg-text-strong"
            >
              자료 업로드
            </Link>
            <Link
              href="/intake"
              className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-5 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
            >
              새 상담 신청
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg border border-line px-5 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
              >
                로그아웃
              </button>
            </form>
          </div>
        </section>

        {/* 알림 배너 */}
        {unreadCount > 0 && (
          <Link
            href="/portal/notifications"
            className="flex items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gold-soft/25 px-6 py-4 transition hover:bg-gold-soft/40"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
                  <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3z" />
                  <path d="M9 19a3 3 0 0 0 6 0" />
                </svg>
              </span>
              <span>
                <span className="font-serif text-sm font-bold text-primary">
                  읽지 않은 알림 {unreadCount}건
                </span>
                <span className="block text-xs text-text-muted">사건 진행 안내·자료 요청을 확인하세요.</span>
              </span>
            </span>
            <span className="font-serif text-sm font-semibold text-gold-deep">확인 →</span>
          </Link>
        )}

        {/* 통계 */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="문의" value={inquiries.length} />
          <Stat label="진행 사건" value={allCases.length} />
          <Stat label="업로드 자료" value={client?.uploadedFiles.length ?? 0} />
        </section>

        {/* 사건 목록 */}
        <section>
          <div className="ethos-divider mb-6 justify-start">
            <h2 className="ethos-display text-xl">내 문의 / 사건</h2>
          </div>

          {inquiries.length === 0 ? (
            <div className="ethos-card p-10 text-center">
              <p className="text-sm text-text-muted">아직 접수된 문의가 없습니다.</p>
              <Link
                href="/intake"
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition hover:bg-text-strong"
              >
                상담 신청하기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((iq) => (
                <div key={iq.id} className="ethos-card ethos-card-hover p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-base font-bold text-primary">{iq.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(iq.createdAt).toLocaleDateString("ko-KR")} 접수
                      </p>
                    </div>
                    {iq.publicTrackingCode && (
                      <Link
                        href={`/track?code=${iq.publicTrackingCode}`}
                        className="flex-shrink-0 rounded-full bg-gold-soft/60 px-3 py-1 font-mono text-xs font-bold text-gold-deep transition hover:bg-gold-soft"
                      >
                        {iq.publicTrackingCode}
                      </Link>
                    )}
                  </div>

                  {iq.caseMatters.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-gold/15 pt-4">
                      {iq.caseMatters.map((c) => {
                        const progress = STATUS_PROGRESS[c.status] ?? 40;
                        return (
                          <Link
                            key={c.id}
                            href={`/portal/cases/${c.id}`}
                            className="block rounded-xl border border-transparent p-3 transition hover:border-gold/30 hover:bg-gold-soft/15"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    {CATEGORY_LABEL[c.category] ?? c.category}
                                  </span>
                                  <span className="truncate font-semibold text-text-strong">{c.title}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-text-muted">{c.caseNo ?? "사건번호 부여 전"}</p>
                              </div>
                              <span className="flex-shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text">
                                {STATUS_LABEL[c.status] ?? c.status}
                              </span>
                            </div>
                            {/* 진행률 바 */}
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold text-gold-deep">{progress}%</span>
                            </div>
                            {/* 다음 단계 안내 */}
                            {STATUS_NEXT_STEP[c.status] && (
                              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-text-muted">
                                <span className="mt-0.5 text-gold-deep">›</span>
                                {STATUS_NEXT_STEP[c.status]}
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 결제 / 서명 / 세금계산서 통합 */}
        {(clientPayments.length > 0 || clientSignatures.length > 0 || clientInvoices.length > 0) && (
          <section>
            <div className="mb-6 ethos-divider justify-start">
              <h2 className="ethos-display text-xl">결제 · 서명 · 세금계산서</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="ethos-card p-5">
                <p className="text-xs text-text-muted">총 입금</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-700">
                  {totalPaid.toLocaleString("ko-KR")}원
                </p>
              </div>
              <div className="ethos-card p-5">
                <p className="text-xs text-text-muted">서명 대기</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">
                  {pendingSignatures.length}건
                </p>
              </div>
              <div className="ethos-card p-5">
                <p className="text-xs text-text-muted">세금계산서</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {clientInvoices.filter((i) => i.status === "ISSUED" || i.status === "SENT").length}건
                </p>
              </div>
            </div>

            {pendingSignatures.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-semibold text-amber-900">서명이 필요한 문서가 있습니다</p>
                <ul className="mt-2 space-y-1.5">
                  {pendingSignatures.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{s.documentTitle}</span>
                      {s.signUrl && (
                        <a
                          href={s.signUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded bg-primary px-3 py-1 text-xs font-semibold text-white"
                        >
                          서명하기 →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {clientPayments.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted text-left text-xs">
                    <tr>
                      <th className="px-4 py-2">결제</th>
                      <th className="px-4 py-2 text-right">금액</th>
                      <th className="px-4 py-2">상태</th>
                      <th className="px-4 py-2">영수증</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {clientPayments.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2">
                          {p.orderName}
                          <span className="ml-1 block font-mono text-xs text-text-muted">
                            {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {p.amount.toLocaleString("ko-KR")}원
                        </td>
                        <td className="px-4 py-2 text-xs">{p.status}</td>
                        <td className="px-4 py-2">
                          {p.receiptUrl ? (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline"
                            >
                              보기
                            </a>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 업로드 자료 */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="ethos-divider justify-start">
              <h2 className="ethos-display text-xl">내 자료</h2>
            </div>
            <Link
              href="/portal/upload"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-text-strong"
            >
              업로드
            </Link>
          </div>

          {!client?.uploadedFiles.length ? (
            <div className="ethos-card p-8 text-center text-sm text-text-muted">
              아직 업로드한 자료가 없습니다.
            </div>
          ) : (
            <div className="ethos-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold/20 bg-surface-muted/50 text-left text-xs uppercase tracking-wider text-gold-deep">
                    <th className="px-5 py-3 font-serif font-bold">파일명</th>
                    <th className="px-5 py-3 font-serif font-bold">크기</th>
                    <th className="px-5 py-3 font-serif font-bold">업로드</th>
                  </tr>
                </thead>
                <tbody>
                  {client.uploadedFiles.map((f) => (
                    <tr key={f.id} className="border-b border-gold/10 transition hover:bg-gold-soft/10 last:border-0">
                      <td className="px-5 py-3 font-medium text-text-strong">{f.fileName}</td>
                      <td className="px-5 py-3 text-text-muted">{(f.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="px-5 py-3 text-text-muted">
                        {new Date(f.uploadedAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ethos-card ethos-card-hover p-6 text-center">
      <p className="ethos-display text-4xl text-primary">{value}</p>
      <p className="mt-2 font-serif text-xs uppercase tracking-wider text-gold-deep">{label}</p>
    </div>
  );
}
