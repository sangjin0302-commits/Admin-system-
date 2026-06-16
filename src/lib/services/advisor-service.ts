/**
 * 행정사 "참모(Chief of Staff)" 운영 조언.
 *
 * DB 실데이터를 규칙으로 분석해 우선순위 있는 조언 카드를 생성한다.
 * 외부 AI 없이 동작(결정적·안정적). LAWBOT 연동 시 향후 보강 가능.
 */

import { prisma } from "@/lib/prisma/client";
import { getAdminIntakeSourceAnalytics } from "@/lib/services/admin-intake-source-analytics";

export type AdvicePriority = "high" | "medium" | "low" | "good";

export type AdviceCard = {
  priority: AdvicePriority;
  title: string;
  detail: string;
  action?: { label: string; href: string };
};

export type AdvisorReport = {
  generatedAt: string;
  metrics: {
    newInquiries: number;
    staleInquiries: number;
    openCases: number;
    dueSoon: number;
    overdue: number;
    noNextAction: number;
  };
  cards: AdviceCard[];
};

const DAY = 24 * 60 * 60 * 1000;

export async function buildAdvisorReport(now: Date = new Date()): Promise<AdvisorReport> {
  const t = now.getTime();

  const [inquiries, cases] = await Promise.all([
    prisma.inquiry
      .findMany({ select: { id: true, status: true, createdAt: true } })
      .catch(() => [] as { id: string; status: string; createdAt: Date }[]),
    prisma.caseMatter
      .findMany({ select: { id: true, status: true, dueDate: true, nextActionAt: true } })
      .catch(() => [] as { id: string; status: string; dueDate: Date | null; nextActionAt: Date | null }[])
  ]);

  const openStatuses = new Set([
    "INTAKE_REVIEW", "CONSULTING", "QUOTED", "CONTRACT_PENDING", "OPEN",
    "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING", "READY_TO_SUBMIT", "SUBMITTED",
    "SUPPLEMENT_REQUESTED", "WAITING_AGENCY", "RESULT_RECEIVED", "CLOSING"
  ]);

  const newInquiries = inquiries.filter((i) => i.status === "NEW").length;
  const staleInquiries = inquiries.filter(
    (i) => ["NEW", "CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(i.status) && t - new Date(i.createdAt).getTime() > 2 * DAY
  ).length;
  const openCases = cases.filter((c) => openStatuses.has(c.status)).length;
  const dueSoon = cases.filter((c) => c.dueDate && new Date(c.dueDate).getTime() - t > 0 && new Date(c.dueDate).getTime() - t <= 7 * DAY).length;
  const overdue = cases.filter((c) => c.dueDate && new Date(c.dueDate).getTime() < t && openStatuses.has(c.status)).length;
  const noNextAction = cases.filter((c) => openStatuses.has(c.status) && !c.nextActionAt).length;
  const quoteSent = inquiries.filter((i) => i.status === "QUOTE_SENT").length;

  const cards: AdviceCard[] = [];

  if (overdue > 0) {
    cards.push({
      priority: "high",
      title: `기한 경과 사건 ${overdue}건`,
      detail: "처리 기한이 지난 진행 사건이 있습니다. 행정심판 청구기한·체류만료 등은 회복이 어려우니 최우선으로 상태를 확인하세요.",
      action: { label: "사건 목록", href: "/admin/cases" }
    });
  }
  if (dueSoon > 0) {
    cards.push({
      priority: "high",
      title: `7일 내 기한 임박 ${dueSoon}건`,
      detail: "이번 주 안에 마감이 걸린 사건입니다. 필요 서류·제출처를 오늘 점검하고 의뢰인에게 보완 요청을 보내두는 것이 안전합니다.",
      action: { label: "사건 목록", href: "/admin/cases" }
    });
  }
  if (newInquiries > 0) {
    cards.push({
      priority: newInquiries >= 3 ? "high" : "medium",
      title: `미응대 신규 문의 ${newInquiries}건`,
      detail: "행정 업무는 첫 응답 속도가 수임률을 크게 좌우합니다. 24시간 내 1차 회신(접수 확인 + 다음 단계 안내)을 권장합니다.",
      action: { label: "문의 목록", href: "/admin/inquiries" }
    });
  }
  if (staleInquiries > 0) {
    cards.push({
      priority: "medium",
      title: `48시간 이상 정체된 상담 ${staleInquiries}건`,
      detail: "상담 단계에서 오래 멈춘 건은 이탈 위험이 큽니다. 간단한 진행 안내나 자료 요청으로 대화를 다시 여세요.",
      action: { label: "문의 목록", href: "/admin/inquiries" }
    });
  }
  if (noNextAction > 0) {
    cards.push({
      priority: "medium",
      title: `다음 액션 미설정 사건 ${noNextAction}건`,
      detail: "진행 중인데 '다음 할 일'이 비어 있는 사건입니다. 각 사건에 다음 액션·예정일을 지정하면 기한 알림이 자동으로 작동합니다.",
      action: { label: "사건 목록", href: "/admin/cases" }
    });
  }
  if (quoteSent > 0) {
    cards.push({
      priority: "low",
      title: `견적 발송 후 대기 ${quoteSent}건`,
      detail: "견적을 보낸 뒤 응답이 없는 건은 3~5일 후 정중한 후속 연락(궁금한 점 확인)으로 전환율을 높일 수 있습니다."
    });
  }

  // 마케팅 분석 봇 — 유입 데이터 기반 조언
  try {
    const mk = await getAdminIntakeSourceAnalytics({});
    const s = mk.summary;
    if (s.totalCount === 0) {
      cards.push({
        priority: "low",
        title: "마케팅: 유입 데이터가 아직 없습니다",
        detail: "문의 폼에 출처 추적 링크(utm)를 붙여 채널별 유입을 측정하면, 어떤 홍보가 효과적인지 데이터로 판단할 수 있습니다.",
        action: { label: "유입 분석", href: "/admin/intake-sources" }
      });
    } else {
      const top = mk.channelCounts[0] ?? mk.sourceCounts[0];
      const untrackedRatio = s.totalCount > 0 ? Math.round((s.untrackedCount / s.totalCount) * 100) : 0;
      if (top) {
        cards.push({
          priority: "low",
          title: `마케팅: 최다 유입 채널 '${top.label}'`,
          detail: `최근 유입의 상당수가 '${top.label}'에서 발생했습니다. 효과 좋은 채널에 콘텐츠(사례·칼럼)를 더 배치하고, 그 채널 전용 상담 링크를 만들어 전환을 추적해 보세요.`,
          action: { label: "유입 분석", href: "/admin/intake-sources" }
        });
      }
      if (untrackedRatio >= 40) {
        cards.push({
          priority: "medium",
          title: `마케팅: 출처 미상 유입 ${untrackedRatio}%`,
          detail: "유입의 상당수가 어디서 왔는지 추적되지 않습니다. 블로그·네이버·명함 QR 등에 utm 파라미터가 붙은 상담 링크를 사용하면 채널 효과를 정확히 측정할 수 있습니다.",
          action: { label: "유입 분석", href: "/admin/intake-sources" }
        });
      }
      cards.push({
        priority: "good",
        title: `마케팅: 최근 30일 ${s.recent30DayCount}건 유입 (7일 ${s.recent7DayCount}건)`,
        detail: "꾸준한 콘텐츠가 장기 유입을 만듭니다. 주 1회 칼럼/사례를 올리고, 처리 사례를 홈페이지에 반영하면 신뢰와 검색 노출이 함께 올라갑니다.",
        action: { label: "사례 관리", href: "/admin/case-studies" }
      });
    }
  } catch {
    /* 분석 실패해도 운영 조언은 유지 */
  }

  // 루틴 조언 (항상 1개)
  cards.push({
    priority: "good",
    title: "주간 운영 루틴 점검",
    detail:
      "① 기한 임박 사건 먼저 → ② 미응대 문의 회신 → ③ 진행 사건 다음 액션 갱신 → ④ 견적 후속 → ⑤ 사례/후기 1건 정리(홈페이지 신뢰도↑). 매주 같은 순서로 돌리면 누락이 줄어듭니다."
  });

  // 전부 깨끗하면 격려
  if (overdue === 0 && dueSoon === 0 && newInquiries === 0 && staleInquiries === 0) {
    cards.unshift({
      priority: "good",
      title: "급한 불은 없습니다 👍",
      detail: "임박 기한·미응대 문의가 없습니다. 이럴 때 사례/칼럼 콘텐츠를 보강하거나 체크리스트 템플릿을 정비해두면 좋습니다."
    });
  }

  return {
    generatedAt: now.toISOString(),
    metrics: { newInquiries, staleInquiries, openCases, dueSoon, overdue, noNextAction },
    cards
  };
}
