import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { calculateCustomerLTV } from "@/lib/services/ltv-service";

export const dynamic = "force-dynamic";

const RISK_COLOR: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const RISK_LABEL: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

function recommendationsFor(
  churnRisk: "low" | "medium" | "high",
  caseCount: number,
): string[] {
  const recs: string[] = [];
  if (churnRisk === "high") {
    recs.push("이탈 신호가 높습니다 — 7일 이내에 직접 연락하십시오.");
    recs.push("무료 상담 또는 사건 점검을 제안하십시오.");
  } else if (churnRisk === "medium") {
    recs.push("분기별 안부 메일과 함께 관련 소식을 발송하십시오.");
    recs.push("아직 이용하지 않은 연관 업무분야를 안내하십시오.");
  } else {
    recs.push("관계가 양호합니다. 정기 뉴스레터 발송 주기를 유지하십시오.");
  }
  if (caseCount === 1) {
    recs.push("추가 제안: 기존 사건 이력과 연관된 두 번째 업무분야를 소개하십시오.");
  }
  if (caseCount >= 3) {
    recs.push("VIP 관리 대상 검토: 전담 담당자 배정 및 우선 응대를 고려하십시오.");
  }
  return recs;
}

export default async function CustomerLTVDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const ltv = await calculateCustomerLTV(email);
  if (!ltv) {
    notFound();
  }

  const caseHistory = await prisma.caseMatter.findMany({
    where: { inquiry: { email } },
    select: {
      id: true,
      caseNo: true,
      title: true,
      status: true,
      createdAt: true,
      closedAt: true,
      accountingMemo: {
        select: { paidAmount: true, paidAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const daysSince = Math.floor(
    (Date.now() - ltv.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const recs = recommendationsFor(ltv.churnRisk, ltv.caseCount);

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">의뢰인 분석</div>
        <h1 className="ui-page-title">{ltv.name}</h1>
        <div className="text-sm text-gray-500">{ltv.email}</div>
        <Link
          href="/admin/ltv"
          className="mt-2 inline-block text-sm hover:underline"
          style={{ color: "#1a3c5f" }}
        >
          &larr; 생애가치 순위로 돌아가기
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">예측 생애가치</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#c9a961" }}>
            ₩{ltv.predictedLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">총 매출</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#1a3c5f" }}>
            ₩{ltv.totalRevenue.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">평균 사건 금액</div>
          <div className="mt-1 text-2xl font-semibold">
            ₩{ltv.avgCaseValue.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">이탈 위험도</div>
          <div
            className="mt-1 text-2xl font-semibold"
            style={{ color: RISK_COLOR[ltv.churnRisk] }}
          >
            {RISK_LABEL[ltv.churnRisk] ?? ltv.churnRisk}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">이탈 위험 요인</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="text-gray-500">최근 활동 이후 경과일:</span>{" "}
            <span className="font-medium">{daysSince}</span>
          </li>
          <li>
            <span className="text-gray-500">사건 수:</span>{" "}
            <span className="font-medium">{ltv.caseCount}</span>
          </li>
          <li>
            <span className="text-gray-500">최초 접촉일:</span>{" "}
            <span className="font-medium">
              {ltv.firstContactDate.toISOString().slice(0, 10)}
            </span>
          </li>
          <li>
            <span className="text-gray-500">최근 활동일:</span>{" "}
            <span className="font-medium">
              {ltv.lastActivityDate.toISOString().slice(0, 10)}
            </span>
          </li>
          <li>
            <span className="text-gray-500">예측 거래 지속 기간:</span>{" "}
            <span className="font-medium">{ltv.predictedLifetimeMonths}개월</span>
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">관계 유지 권장 조치</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {recs.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">사건 이력</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">사건번호</th>
                <th className="py-2">사건명</th>
                <th className="py-2">상태</th>
                <th className="py-2">접수일</th>
                <th className="py-2 text-right">수납 금액</th>
                <th className="py-2">수납일</th>
              </tr>
            </thead>
            <tbody>
              {caseHistory.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{c.caseNo ?? "-"}</td>
                  <td className="py-2">{c.title}</td>
                  <td className="py-2">{c.status}</td>
                  <td className="py-2">
                    {c.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2 text-right">
                    {c.accountingMemo?.paidAmount
                      ? `₩${c.accountingMemo.paidAmount.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="py-2">
                    {c.accountingMemo?.paidAt
                      ? c.accountingMemo.paidAt.toISOString().slice(0, 10)
                      : "-"}
                  </td>
                </tr>
              ))}
              {caseHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    등록된 사건이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
