/**
 * AI 멀티스텝 자동화 에이전트 오케스트레이터.
 *
 * 여러 서비스 (priority-scoring · checklist-generator · consultation-script ·
 * review-request · reengagement · kakao-notification) 를 하나의 워크플로로 묶어
 * 관리자가 원클릭으로 실행할 수 있게 합니다.
 *
 * - 단계는 하드코딩된 워크플로 정의를 사용합니다.
 * - dependsOn 순서를 지키며 순차 실행합니다 (병렬 실행 미지원 — 단순성 우선).
 * - 각 단계는 성공/실패/스킵 결과와 요약 텍스트를 반환합니다.
 * - onEvent 콜백으로 진행 상황을 스트리밍 (SSE 라우트에서 사용).
 */

import { logger } from "@/lib/utils/logger";
import { scoreInquiry } from "./priority-scoring-service";
import { generateChecklist } from "./checklist-generator-service";
import { generateConsultationScript } from "./consultation-script-generator";
import { sendReviewRequest } from "./review-request-service";
import { scoreReengagement } from "./reengagement-service";
import { notifyInquiryReceived } from "./kakao-notification-service";
import { prisma } from "@/lib/prisma/client";

export type AgentStep = {
  id: string;
  action: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
};

export type AgentWorkflow = {
  id: string;
  label: string;
  description: string;
  /** 이 워크플로가 다루는 엔티티 종류. */
  entity: "inquiry" | "case";
  steps: AgentStep[];
};

export type StepResult = {
  stepId: string;
  action: string;
  status: "ok" | "failed" | "skipped";
  summary: string;
  data?: unknown;
  startedAt: string;
  endedAt: string;
  error?: string;
};

export type AgentResult = {
  workflowId: string;
  entityId: string;
  startedAt: string;
  endedAt: string;
  ok: boolean;
  steps: StepResult[];
};

export type AgentEvent =
  | { type: "start"; workflowId: string; entityId: string; totalSteps: number }
  | { type: "step:start"; stepId: string; action: string; index: number }
  | { type: "step:end"; stepId: string; action: string; result: StepResult; index: number }
  | { type: "done"; result: AgentResult }
  | { type: "error"; message: string };

// ── 예약 워크플로 정의 ────────────────────────────────────────────

export const WORKFLOWS: AgentWorkflow[] = [
  {
    id: "new_inquiry_full_process",
    label: "신규 문의 종합 처리",
    description: "우선순위 점수 → 체크리스트 생성 → 상담 스크립트 → 카카오 접수 확인",
    entity: "inquiry",
    steps: [
      { id: "score", action: "scoreInquiry", params: {} },
      { id: "checklist", action: "generateChecklist", params: {}, dependsOn: ["score"] },
      { id: "script", action: "draftConsultationScript", params: {}, dependsOn: ["score"] },
      { id: "notify", action: "sendKakaoConfirmation", params: {}, dependsOn: ["script"] },
    ],
  },
  {
    id: "case_open_prep",
    label: "사건 개시 준비",
    description: "체크리스트 생성 → 필요 서류 도출 → 고객 안내",
    entity: "case",
    steps: [
      { id: "checklist", action: "createChecklist", params: {} },
      { id: "docs", action: "generateRequiredDocs", params: {}, dependsOn: ["checklist"] },
      { id: "notify", action: "notifyClient", params: {}, dependsOn: ["docs"] },
    ],
  },
  {
    id: "case_close_wrap",
    label: "사건 종결 마무리",
    description: "종결 요약 → 후기 요청 → 재참여 스케줄",
    entity: "case",
    steps: [
      { id: "summary", action: "generateClosingSummary", params: {} },
      { id: "review", action: "sendReviewRequest", params: {}, dependsOn: ["summary"] },
      { id: "reeng", action: "scheduleReengagement", params: {}, dependsOn: ["review"] },
    ],
  },
];

export function listWorkflows(): AgentWorkflow[] {
  return WORKFLOWS;
}

export function findWorkflow(id: string): AgentWorkflow | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

// ── 실행 컨텍스트 ────────────────────────────────────────────────

type ExecutionContext = {
  workflow: AgentWorkflow;
  entityId: string;
  results: Map<string, StepResult>;
};

async function runStep(ctx: ExecutionContext, step: AgentStep): Promise<StepResult> {
  const startedAt = new Date().toISOString();
  const base = { stepId: step.id, action: step.action, startedAt };

  // 의존성 실패 시 skip
  if (step.dependsOn) {
    for (const depId of step.dependsOn) {
      const dep = ctx.results.get(depId);
      if (!dep || dep.status !== "ok") {
        return {
          ...base,
          endedAt: new Date().toISOString(),
          status: "skipped",
          summary: `의존 단계 ${depId} 실패로 건너뜀`,
        };
      }
    }
  }

  try {
    const summary = await executeAction(step.action, ctx.entityId);
    return {
      ...base,
      endedAt: new Date().toISOString(),
      status: "ok",
      summary,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn("[ai-agent] step failed", { stepId: step.id, action: step.action, err: msg });
    return {
      ...base,
      endedAt: new Date().toISOString(),
      status: "failed",
      summary: `실패: ${msg}`,
      error: msg,
    };
  }
}

async function executeAction(action: string, entityId: string): Promise<string> {
  switch (action) {
    case "scoreInquiry": {
      const score = await scoreInquiry(entityId);
      return `우선순위 점수 산정 완료 (total ${score.total}, 긴급 ${score.urgency})`;
    }
    case "generateChecklist":
    case "createChecklist": {
      const cl = await generateChecklist(entityId);
      return `체크리스트 ${cl.steps.length}단계 생성 (${cl.provider})`;
    }
    case "draftConsultationScript": {
      const s = await generateConsultationScript(entityId);
      const opening = (s.greeting ?? "").slice(0, 40);
      return `상담 스크립트 생성 (인사말: ${opening}…)`;
    }
    case "sendKakaoConfirmation": {
      const inq = await prisma.inquiry.findUnique({
        where: { id: entityId },
        select: { id: true, contactName: true, phone: true, title: true, publicTrackingCode: true },
      });
      if (!inq?.phone) return "전화번호 없음 — 카카오 발송 스킵";
      const ok = await notifyInquiryReceived(
        inq.phone,
        inq.contactName ?? "고객",
        inq.publicTrackingCode ?? inq.id,
      );
      return ok ? "카카오 접수 확인 발송" : "카카오 발송 실패(템플릿 미설정 가능)";
    }
    case "generateRequiredDocs": {
      // 체크리스트 스텝의 requiredDocuments 를 취합
      const cl = await generateChecklist(entityId);
      const docs = new Set<string>();
      for (const s of cl.steps) for (const d of s.requiredDocuments) docs.add(d);
      return `필요 서류 ${docs.size}종 도출`;
    }
    case "notifyClient": {
      const cm = await prisma.caseMatter.findUnique({
        where: { id: entityId },
        include: { inquiry: { select: { contactName: true, phone: true, publicTrackingCode: true, id: true } } },
      });
      const phone = cm?.inquiry?.phone;
      if (!phone) return "고객 전화번호 없음 — 발송 스킵";
      const ok = await notifyInquiryReceived(
        phone,
        cm?.inquiry?.contactName ?? "고객",
        cm?.inquiry?.publicTrackingCode ?? cm?.inquiry?.id ?? entityId,
      );
      return ok ? "고객 안내 발송" : "고객 안내 발송 실패";
    }
    case "generateClosingSummary": {
      const cm = await prisma.caseMatter.findUnique({
        where: { id: entityId },
        select: { title: true, summary: true, closedAt: true, category: true },
      });
      if (!cm) throw new Error("사건을 찾을 수 없습니다.");
      const parts = [
        `사건: ${cm.title}`,
        cm.category ? `분야: ${cm.category}` : null,
        cm.summary ? `요약: ${cm.summary.slice(0, 120)}` : null,
        cm.closedAt ? `종결일: ${cm.closedAt.toISOString().slice(0, 10)}` : null,
      ].filter(Boolean);
      return `종결 요약 생성 — ${parts.join(" · ")}`;
    }
    case "sendReviewRequest": {
      // case → inquiry 매핑
      const cm = await prisma.caseMatter.findUnique({
        where: { id: entityId },
        select: { inquiryId: true },
      });
      const inquiryId = cm?.inquiryId ?? entityId;
      const r = await sendReviewRequest(inquiryId);
      return r.ok ? `후기 요청 발송 (${r.channels.join(", ")})` : `후기 요청 실패: ${r.error ?? "-"}`;
    }
    case "scheduleReengagement": {
      const cm = await prisma.caseMatter.findUnique({
        where: { id: entityId },
        include: { inquiry: { select: { email: true } } },
      });
      const email = cm?.inquiry?.email;
      if (!email) return "이메일 없음 — 재참여 스킵";
      const s = await scoreReengagement(email);
      if (!s) return "재참여 대상 아님";
      return `재참여 예약 (${s.suggestedMonth}, score ${s.score})`;
    }
    default:
      throw new Error(`알 수 없는 액션: ${action}`);
  }
}

/**
 * 의존성 순서대로 워크플로를 실행합니다.
 * onEvent 콜백이 있으면 진행 상황을 스트리밍합니다.
 */
export async function runAgentWorkflow(
  workflowId: string,
  entityId: string,
  onEvent?: (ev: AgentEvent) => void,
): Promise<AgentResult> {
  const workflow = findWorkflow(workflowId);
  if (!workflow) throw new Error(`알 수 없는 워크플로: ${workflowId}`);
  if (!entityId) throw new Error("entityId 필요");

  const startedAt = new Date().toISOString();
  onEvent?.({ type: "start", workflowId, entityId, totalSteps: workflow.steps.length });

  const ctx: ExecutionContext = { workflow, entityId, results: new Map() };
  const order = topoOrder(workflow.steps);

  let index = 0;
  for (const step of order) {
    onEvent?.({ type: "step:start", stepId: step.id, action: step.action, index });
    const result = await runStep(ctx, step);
    ctx.results.set(step.id, result);
    onEvent?.({ type: "step:end", stepId: step.id, action: step.action, result, index });
    index++;
  }

  const steps = order.map((s) => ctx.results.get(s.id)!).filter(Boolean);
  const ok = steps.every((s) => s.status === "ok");
  const endedAt = new Date().toISOString();

  const result: AgentResult = { workflowId, entityId, startedAt, endedAt, ok, steps };
  onEvent?.({ type: "done", result });

  logger.info("[ai-agent] workflow done", { workflowId, entityId, ok });
  return result;
}

/** 의존성 위상정렬 — 순환 시 원본 순서 반환. */
function topoOrder(steps: AgentStep[]): AgentStep[] {
  const map = new Map(steps.map((s) => [s.id, s]));
  const out: AgentStep[] = [];
  const seen = new Set<string>();

  const visit = (s: AgentStep, stack: Set<string>): void => {
    if (seen.has(s.id)) return;
    if (stack.has(s.id)) return; // 순환 방지
    stack.add(s.id);
    for (const depId of s.dependsOn ?? []) {
      const dep = map.get(depId);
      if (dep) visit(dep, stack);
    }
    stack.delete(s.id);
    seen.add(s.id);
    out.push(s);
  };

  for (const s of steps) visit(s, new Set());
  return out.length === steps.length ? out : steps;
}
