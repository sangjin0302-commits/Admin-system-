/**
 * 매크로 시스템 서비스.
 *
 * 자주 쓰는 액션 시퀀스를 매크로로 저장하고 재생.
 * - 저장: SiteSetting `macros.list` (JSON 배열)
 * - 액션: send_kakao, send_email, update_status, create_task, add_note
 *   실제 발송은 stub (이벤트 큐/로그). 통합 훅은 별도 서비스가 소비.
 *
 * Feature flag: `macro_system`.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const LIST_KEY = "macros.list";
const LOG_KEY = "macros.runlog";
const MAX_LOG = 200;

export const MACRO_ACTIONS = [
  "send_kakao",
  "send_email",
  "update_status",
  "create_task",
  "add_note",
] as const;

export type MacroActionType = (typeof MACRO_ACTIONS)[number];

export type MacroStep = {
  action: MacroActionType;
  params: Record<string, unknown>;
};

export type Macro = {
  id: string;
  name: string;
  description?: string;
  steps: MacroStep[];
  hotkey?: string; // e.g. "ctrl+alt+1"
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type MacroRunContext = {
  caseId?: string;
  inquiryId?: string;
  clientEmail?: string;
  actorName?: string;
};

export type MacroStepResult = {
  step: number;
  action: MacroActionType;
  ok: boolean;
  message: string;
};

export type MacroRunResult = {
  macroId: string;
  triggeredAt: string;
  context: MacroRunContext;
  results: MacroStepResult[];
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

function newId(prefix = "mac"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function listMacros(): Promise<Macro[]> {
  return readJson<Macro[]>(LIST_KEY, []);
}

export async function getMacro(id: string): Promise<Macro | null> {
  const list = await listMacros();
  return list.find((m) => m.id === id) ?? null;
}

export type MacroInput = {
  name: string;
  description?: string;
  steps: MacroStep[];
  hotkey?: string;
  createdBy?: string;
};

function validateSteps(steps: unknown): MacroStep[] {
  if (!Array.isArray(steps)) throw new Error("steps 배열이 필요합니다.");
  return steps.map((s, i) => {
    const raw = s as { action?: unknown; params?: unknown };
    if (typeof raw.action !== "string" || !MACRO_ACTIONS.includes(raw.action as MacroActionType)) {
      throw new Error(`step ${i}: 알 수 없는 action`);
    }
    const params = raw.params && typeof raw.params === "object" ? (raw.params as Record<string, unknown>) : {};
    return { action: raw.action as MacroActionType, params };
  });
}

export async function saveMacro(input: MacroInput): Promise<Macro> {
  const list = await listMacros();
  const now = new Date().toISOString();
  const macro: Macro = {
    id: newId(),
    name: input.name.trim() || "이름 없음",
    description: input.description?.trim() || undefined,
    steps: validateSteps(input.steps),
    hotkey: input.hotkey?.trim() || undefined,
    createdBy: input.createdBy?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(macro);
  await writeJson(LIST_KEY, list);
  return macro;
}

export async function updateMacro(id: string, patch: Partial<MacroInput>): Promise<Macro | null> {
  const list = await listMacros();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const cur = list[idx];
  const updated: Macro = {
    ...cur,
    name: patch.name?.trim() ?? cur.name,
    description: patch.description?.trim() ?? cur.description,
    steps: patch.steps ? validateSteps(patch.steps) : cur.steps,
    hotkey: patch.hotkey?.trim() ?? cur.hotkey,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  await writeJson(LIST_KEY, list);
  return updated;
}

export async function deleteMacro(id: string): Promise<boolean> {
  const list = await listMacros();
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return false;
  await writeJson(LIST_KEY, next);
  return true;
}

/** 단일 스텝 실행 — 실제 발송은 stub이고 이벤트 로그로 기록. */
async function runStep(
  step: MacroStep,
  ctx: MacroRunContext,
  index: number,
): Promise<MacroStepResult> {
  try {
    switch (step.action) {
      case "send_kakao": {
        const template = String(step.params.template ?? "");
        // stub: 로그만 남김
        logger.info(`[macro] send_kakao template=${template} ctx=${JSON.stringify(ctx)}`);
        return { step: index, action: step.action, ok: true, message: `KakaoTalk (${template}) 발송 큐잉` };
      }
      case "send_email": {
        const subject = String(step.params.subject ?? "");
        logger.info(`[macro] send_email subject=${subject} ctx=${JSON.stringify(ctx)}`);
        return { step: index, action: step.action, ok: true, message: `이메일(${subject}) 발송 큐잉` };
      }
      case "update_status": {
        const status = String(step.params.status ?? "");
        if (!status) throw new Error("status 파라미터 없음");
        if (ctx.caseId) {
          await prisma.caseEvent.create({
            data: {
              caseId: ctx.caseId,
              eventType: "MACRO_STATUS_UPDATE_REQUEST",
              actorName: ctx.actorName ?? "macro",
              message: `매크로에 의한 상태 변경 요청: ${status}`,
            },
          });
        }
        return { step: index, action: step.action, ok: true, message: `상태 변경 요청: ${status}` };
      }
      case "create_task": {
        const title = String(step.params.title ?? "매크로 생성 과제");
        if (ctx.caseId) {
          await prisma.caseTask.create({
            data: {
              caseId: ctx.caseId,
              title,
              status: "TODO",
              priority: "NORMAL",
              details: String(step.params.details ?? ""),
              assignedTo: ctx.actorName ?? null,
            },
          });
        }
        return { step: index, action: step.action, ok: true, message: `과제 생성: ${title}` };
      }
      case "add_note": {
        const note = String(step.params.note ?? "");
        if (ctx.caseId && note) {
          await prisma.caseEvent.create({
            data: {
              caseId: ctx.caseId,
              eventType: "MACRO_NOTE",
              actorName: ctx.actorName ?? "macro",
              message: note,
            },
          });
        }
        return { step: index, action: step.action, ok: true, message: `메모 추가` };
      }
      default: {
        // unreachable due to types, but keep runtime guard
        const _exhaustive: never = step.action;
        return { step: index, action: step.action, ok: false, message: `알 수 없는 action: ${String(_exhaustive)}` };
      }
    }
  } catch (err) {
    return {
      step: index,
      action: step.action,
      ok: false,
      message: (err as Error).message ?? "실패",
    };
  }
}

export async function runMacro(macroId: string, ctx: MacroRunContext = {}): Promise<MacroRunResult> {
  const enabled = await isFeatureEnabled("macro_system").catch(() => true);
  if (!enabled) throw new Error("macro_system 기능이 비활성화되어 있습니다.");
  const macro = await getMacro(macroId);
  if (!macro) throw new Error("매크로를 찾을 수 없습니다.");
  const results: MacroStepResult[] = [];
  for (let i = 0; i < macro.steps.length; i++) {
    results.push(await runStep(macro.steps[i], ctx, i));
  }
  const summary: MacroRunResult = {
    macroId,
    triggeredAt: new Date().toISOString(),
    context: ctx,
    results,
  };
  try {
    const log = await readJson<MacroRunResult[]>(LOG_KEY, []);
    log.unshift(summary);
    await writeJson(LOG_KEY, log.slice(0, MAX_LOG));
  } catch (err) {
    logger.warn("[macro] 로그 기록 실패", err);
  }
  return summary;
}
