/**
 * 사건 진행 자동화 워크플로 엔진.
 *
 * SiteSetting key `workflow.rules` 에 JSON 배열로 규칙 저장 (관리자 편집 가능).
 * 미설정 시 DEFAULT_WORKFLOW_RULES 사용.
 *
 * 사용:
 *   await runWorkflow("inquiry", oldStatus, newStatus, inquiry);
 *   await runWorkflow("case", oldStatus, newStatus, caseMatter);
 *
 * 액션은 best-effort. 하나가 실패해도 전체는 계속 진행하며 로그만 남긴다.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type WorkflowEntity = "inquiry" | "case";

export type WorkflowActionType =
  | "sendTelegram"
  | "sendEmail"
  | "createReminder"
  | "requestDocuments"
  | "logNote";

export interface WorkflowAction {
  type: WorkflowActionType;
  params: Record<string, unknown>;
}

export interface WorkflowRule {
  id?: string;
  name?: string;
  enabled?: boolean;
  trigger: {
    entity: WorkflowEntity;
    fromStatus?: string;
    toStatus: string;
  };
  actions: WorkflowAction[];
}

/**
 * 하드코딩된 기본 규칙 세트. workflow.rules 가 비어 있을 때 fallback.
 */
export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "default.inquiry.new",
    name: "새 문의 접수 — 텔레그램 + 자료 요청",
    enabled: true,
    trigger: { entity: "inquiry", toStatus: "NEW" },
    actions: [
      {
        type: "sendTelegram",
        params: { title: "새 문의 접수", channel: "admin" }
      },
      {
        type: "requestDocuments",
        params: {
          note: "기본 자료 요청 (신분증, 관련 서류)"
        }
      }
    ]
  },
  {
    id: "default.case.consulting",
    name: "상담 시작 — 3일 뒤 리마인더",
    enabled: true,
    trigger: { entity: "case", toStatus: "CONSULTING" },
    actions: [
      {
        type: "createReminder",
        params: {
          delayDays: 3,
          title: "상담 후속 조치 확인",
          taskType: "FOLLOWUP"
        }
      }
    ]
  },
  {
    id: "default.case.submitted",
    name: "기관 제출 완료 — 접수 확인 이메일",
    enabled: true,
    trigger: { entity: "case", toStatus: "SUBMITTED" },
    actions: [
      {
        type: "sendEmail",
        params: {
          subject: "기관 접수가 완료되었습니다",
          template: "case_submitted"
        }
      }
    ]
  },
  {
    id: "default.case.waiting_agency",
    name: "기관 대기 — 매주 리마인더",
    enabled: true,
    trigger: { entity: "case", toStatus: "WAITING_AGENCY" },
    actions: [
      {
        type: "createReminder",
        params: {
          delayDays: 7,
          title: "기관 처리 진행 상황 확인",
          taskType: "AGENCY_CHECK",
          recurring: "weekly"
        }
      }
    ]
  }
];

const WORKFLOW_RULES_KEY = "workflow.rules";

export async function loadWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: WORKFLOW_RULES_KEY }
    });
    if (!row || !row.value?.trim()) return DEFAULT_WORKFLOW_RULES;
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return DEFAULT_WORKFLOW_RULES;
    return parsed.filter(isValidRule);
  } catch (err) {
    logger.warn("[workflow-engine] failed to load rules", err);
    return DEFAULT_WORKFLOW_RULES;
  }
}

export async function saveWorkflowRules(
  rules: WorkflowRule[],
  updatedBy?: string
): Promise<void> {
  const clean = rules.filter(isValidRule);
  const json = JSON.stringify(clean, null, 2);
  await prisma.siteSetting.upsert({
    where: { key: WORKFLOW_RULES_KEY },
    create: { key: WORKFLOW_RULES_KEY, value: json, updatedBy: updatedBy ?? null },
    update: { value: json, updatedBy: updatedBy ?? null }
  });
}

function isValidRule(value: unknown): value is WorkflowRule {
  if (!value || typeof value !== "object") return false;
  const rule = value as WorkflowRule;
  if (!rule.trigger || typeof rule.trigger !== "object") return false;
  if (rule.trigger.entity !== "inquiry" && rule.trigger.entity !== "case") return false;
  if (typeof rule.trigger.toStatus !== "string" || rule.trigger.toStatus.length === 0) return false;
  if (!Array.isArray(rule.actions)) return false;
  return true;
}

export interface WorkflowRunResult {
  ruleId: string;
  ruleName?: string;
  actions: Array<{
    type: WorkflowActionType;
    ok: boolean;
    reason?: string;
  }>;
}

/**
 * 상태 전환 시 매칭되는 규칙을 실행한다.
 * 실패는 로그로만 남기고 throw 하지 않는다.
 */
export async function runWorkflow(
  entity: WorkflowEntity,
  fromStatus: string | undefined,
  toStatus: string,
  entityData: Record<string, unknown>
): Promise<WorkflowRunResult[]> {
  const rules = await loadWorkflowRules();
  const matching = rules.filter((r) => {
    if (r.enabled === false) return false;
    if (r.trigger.entity !== entity) return false;
    if (r.trigger.toStatus !== toStatus) return false;
    if (r.trigger.fromStatus && fromStatus && r.trigger.fromStatus !== fromStatus) return false;
    return true;
  });

  const results: WorkflowRunResult[] = [];
  for (const rule of matching) {
    const actionResults: WorkflowRunResult["actions"] = [];
    for (const action of rule.actions) {
      try {
        const r = await executeAction(action, entity, entityData);
        actionResults.push({ type: action.type, ok: r.ok, reason: r.reason });
      } catch (err) {
        logger.warn(
          `[workflow-engine] action ${action.type} failed for rule ${rule.id ?? rule.name}`,
          err
        );
        actionResults.push({
          type: action.type,
          ok: false,
          reason: err instanceof Error ? err.message : "exception"
        });
      }
    }
    results.push({
      ruleId: rule.id ?? "(unnamed)",
      ruleName: rule.name,
      actions: actionResults
    });
  }
  return results;
}

/** Dry-run: 실행 없이 어떤 액션이 걸리는지 반환. Admin UI 테스트 버튼에서 사용. */
export async function simulateWorkflow(
  entity: WorkflowEntity,
  fromStatus: string | undefined,
  toStatus: string
): Promise<WorkflowRule[]> {
  const rules = await loadWorkflowRules();
  return rules.filter((r) => {
    if (r.enabled === false) return false;
    if (r.trigger.entity !== entity) return false;
    if (r.trigger.toStatus !== toStatus) return false;
    if (r.trigger.fromStatus && fromStatus && r.trigger.fromStatus !== fromStatus) return false;
    return true;
  });
}

async function executeAction(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  switch (action.type) {
    case "sendTelegram":
      return executeSendTelegram(action, entity, entityData);
    case "sendEmail":
      return executeSendEmail(action, entity, entityData);
    case "createReminder":
      return executeCreateReminder(action, entity, entityData);
    case "requestDocuments":
      return executeRequestDocuments(action, entity, entityData);
    case "logNote":
      return executeLogNote(action, entity, entityData);
    default:
      return { ok: false, reason: `unknown_action:${(action as WorkflowAction).type}` };
  }
}

async function executeSendTelegram(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const { sendTelegramAlert } = await import("@/lib/services/telegram-notify");
  const title = (action.params.title as string | undefined) ?? "워크플로 알림";
  const channel = (action.params.channel as "admin" | "public" | undefined) ?? "admin";
  const identifier = getEntityIdentifier(entity, entityData);
  const lines = [
    `${entity === "inquiry" ? "문의" : "사건"}: ${identifier.title}`,
    identifier.id ? `ID: ${identifier.id}` : null
  ].filter(Boolean) as string[];
  const res = await sendTelegramAlert({
    kind: "system",
    title,
    lines,
    channel
  });
  return { ok: res.ok, reason: res.reason };
}

async function executeSendEmail(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const subject = (action.params.subject as string | undefined) ?? "안내";
  const to = extractRecipientEmail(entity, entityData);
  if (!to) return { ok: false, reason: "no_recipient_email" };
  try {
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, reason: "email_not_configured" };
    const resend = new Resend(apiKey);
    const fromEmail =
      process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@ethosattorney.com";
    const bodyText =
      (action.params.body as string | undefined) ??
      `안녕하세요.\n\n${subject} 관련 안내드립니다.\n\n감사합니다.`;
    const { error } = await resend.emails.send({
      from: `ETHOS <${fromEmail}>`,
      to,
      subject,
      text: bodyText
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "email_exception" };
  }
}

async function executeCreateReminder(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const delayDays = Number(action.params.delayDays ?? 3);
  const title =
    (action.params.title as string | undefined) ?? "워크플로 리마인더";
  const taskType = (action.params.taskType as string | undefined) ?? "REMINDER";
  const dueDate = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

  const inquiryId =
    entity === "inquiry"
      ? (entityData.id as string | undefined)
      : (entityData.inquiryId as string | undefined);
  const caseId = entity === "case" ? (entityData.id as string | undefined) : undefined;

  await prisma.caseTask.create({
    data: {
      inquiryId: inquiryId ?? null,
      caseId: caseId ?? null,
      title,
      taskType,
      status: "TODO",
      priority: "NORMAL",
      dueDate,
      source: "workflow"
    }
  });
  return { ok: true };
}

async function executeRequestDocuments(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const note = (action.params.note as string | undefined) ?? "필수 서류 안내";
  const inquiryId =
    entity === "inquiry"
      ? (entityData.id as string | undefined)
      : (entityData.inquiryId as string | undefined);
  const caseId = entity === "case" ? (entityData.id as string | undefined) : undefined;

  await prisma.caseTask.create({
    data: {
      inquiryId: inquiryId ?? null,
      caseId: caseId ?? null,
      title: `자료 요청: ${note}`,
      taskType: "DOCUMENT_REQUEST",
      status: "TODO",
      priority: "NORMAL",
      source: "workflow"
    }
  });
  return { ok: true };
}

async function executeLogNote(
  action: WorkflowAction,
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const note = (action.params.note as string | undefined) ?? "워크플로 노트";
  logger.info(
    `[workflow-engine] logNote entity=${entity} id=${entityData.id ?? "?"} note=${note}`
  );
  return { ok: true };
}

function getEntityIdentifier(
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): { id: string | null; title: string } {
  const id = (entityData.id as string | undefined) ?? null;
  const title =
    (entityData.title as string | undefined) ??
    (entityData.caseNo as string | undefined) ??
    (entityData.contactName as string | undefined) ??
    (id ?? "(unknown)");
  return { id, title };
}

function extractRecipientEmail(
  entity: WorkflowEntity,
  entityData: Record<string, unknown>
): string | null {
  if (entity === "inquiry") {
    return (entityData.email as string | undefined) ?? null;
  }
  // case: nested inquiry.email
  const inquiry = entityData.inquiry as { email?: string | null } | undefined;
  return inquiry?.email ?? null;
}
