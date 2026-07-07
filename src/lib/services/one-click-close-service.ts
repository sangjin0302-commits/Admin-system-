/**
 * 원클릭 사건 클로징 서비스.
 *
 * 사건 종결에 필요한 모든 액션을 한 번에 수행합니다:
 *  1. 상태 → CLOSED
 *  2. AI 종결 요약 리포트 생성 (Haiku)
 *  3. 최종 인보이스/영수증 큐잉
 *  4. NPS 설문 전송 큐잉
 *  5. 캘린더 종결 항목 등록
 *  6. 사건 문서 아카이브
 *  7. 리인게이지먼트 스케줄링
 *
 * 각 액션은 실패해도 다른 액션 진행에 영향 없도록 격리.
 * 리턴: `{ actions: [...], reportUrl }`.
 * 저장: SiteSetting `one_click_close.log` (최근 100 실행 이력).
 *
 * Feature flag: `one_click_close`.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { updateCaseMatterStatus } from "@/lib/services/case-matter";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const LOG_KEY = "one_click_close.log";
const MAX_LOG = 100;

export type CloseAction =
  | "status_closed"
  | "closing_report"
  | "final_invoice"
  | "nps_survey"
  | "calendar_entry"
  | "archive_documents"
  | "reengagement_schedule";

export const ALL_CLOSE_ACTIONS: CloseAction[] = [
  "status_closed",
  "closing_report",
  "final_invoice",
  "nps_survey",
  "calendar_entry",
  "archive_documents",
  "reengagement_schedule",
];

export type CloseActionResult = {
  action: CloseAction;
  ok: boolean;
  message: string;
  detail?: Record<string, unknown>;
};

export type CloseFlowInput = {
  caseId: string;
  actorName?: string | null;
  actions?: CloseAction[]; // 미지정 시 전체
  trigger?: string; // 예: "admin.button", "workflow"
};

export type CloseFlowResult = {
  caseId: string;
  triggeredAt: string;
  actions: CloseActionResult[];
  reportUrl: string | null;
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

async function appendLog(entry: CloseFlowResult): Promise<void> {
  const list = await readJson<CloseFlowResult[]>(LOG_KEY, []);
  list.unshift(entry);
  const trimmed = list.slice(0, MAX_LOG);
  await writeJson(LOG_KEY, trimmed);
}

async function loadCase(caseId: string) {
  return prisma.caseMatter.findUnique({
    where: { id: caseId },
    include: {
      parties: { where: { role: "CLIENT" }, take: 1 },
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      requiredDocuments: true,
      accountingMemo: true,
    },
  });
}

type LoadedCase = NonNullable<Awaited<ReturnType<typeof loadCase>>>;

async function actionStatusClosed(
  c: LoadedCase,
  actor: string | null,
): Promise<CloseActionResult> {
  if (c.status === "CLOSED") {
    return { action: "status_closed", ok: true, message: "이미 CLOSED 상태입니다." };
  }
  try {
    await updateCaseMatterStatus({
      caseMatterId: c.id,
      status: "CLOSED",
      actorName: actor,
      statusChangeNote: "원클릭 종결",
    });
    return { action: "status_closed", ok: true, message: "상태를 CLOSED로 변경했습니다." };
  } catch (err) {
    return {
      action: "status_closed",
      ok: false,
      message: (err as Error).message ?? "상태 변경 실패",
    };
  }
}

async function actionClosingReport(c: LoadedCase): Promise<CloseActionResult> {
  try {
    const client = c.parties[0];
    const events = c.events
      .slice(0, 12)
      .map((e) => `- ${e.eventType}: ${e.message}`)
      .join("\n");
    const prompt = [
      `아래 사건에 대한 간결한 종결 보고서를 작성하세요. (한국어, 6~10줄, 존댓말)`,
      `제목: ${c.title}`,
      `사건번호: ${c.caseNo ?? "-"}`,
      `카테고리: ${c.category ?? "-"}`,
      `의뢰인: ${client?.name ?? "-"}`,
      `요약: ${c.summary ?? "-"}`,
      `주요 이벤트:\n${events || "(없음)"}`,
      `\n출력 형식:`,
      `1) 진행 요약  2) 결과  3) 다음 유의사항  4) 감사 인사`,
    ].join("\n");
    const res = await smartInvoke("summarize", prompt, { forceLevel: "cheap", maxTokens: 700 });
    // 사건 이벤트로 저장 → 리포트 URL 대신 이벤트 링크 반환
    const evt = await prisma.caseEvent.create({
      data: {
        caseId: c.id,
        eventType: "CLOSING_REPORT_GENERATED",
        actorName: "system",
        message: "원클릭 종결 리포트 생성",
        payloadJson: JSON.stringify({ report: res.text, model: res.model }),
      },
    });
    return {
      action: "closing_report",
      ok: true,
      message: "종결 리포트를 생성했습니다.",
      detail: { eventId: evt.id, model: res.model, reportUrl: `/api/admin/cases/${c.id}/report` },
    };
  } catch (err) {
    return {
      action: "closing_report",
      ok: false,
      message: (err as Error).message ?? "리포트 생성 실패",
    };
  }
}

async function actionFinalInvoice(c: LoadedCase): Promise<CloseActionResult> {
  try {
    // 최종 인보이스 큐 SiteSetting에 추가 (실제 발행은 별도 워크플로).
    const key = "one_click_close.invoice_queue";
    const queue = await readJson<Array<{ caseId: string; queuedAt: string; amount: number | null }>>(
      key,
      [],
    );
    queue.unshift({
      caseId: c.id,
      queuedAt: new Date().toISOString(),
      amount: c.accountingMemo?.feeAmount ?? null,
    });
    await writeJson(key, queue.slice(0, 500));
    await prisma.caseEvent.create({
      data: {
        caseId: c.id,
        eventType: "FINAL_INVOICE_QUEUED",
        actorName: "system",
        message: "최종 인보이스 발행 큐 등록",
      },
    });
    return { action: "final_invoice", ok: true, message: "최종 인보이스 큐에 등록했습니다." };
  } catch (err) {
    return {
      action: "final_invoice",
      ok: false,
      message: (err as Error).message ?? "인보이스 큐잉 실패",
    };
  }
}

async function actionNpsSurvey(c: LoadedCase): Promise<CloseActionResult> {
  try {
    const client = c.parties[0];
    if (!client?.email) {
      return { action: "nps_survey", ok: false, message: "의뢰인 이메일이 없어 NPS 발송을 건너뛰었습니다." };
    }
    const key = "one_click_close.nps_queue";
    const queue = await readJson<Array<{ caseId: string; email: string; queuedAt: string }>>(key, []);
    queue.unshift({ caseId: c.id, email: client.email, queuedAt: new Date().toISOString() });
    await writeJson(key, queue.slice(0, 500));
    return { action: "nps_survey", ok: true, message: "NPS 설문 발송 큐에 등록했습니다." };
  } catch (err) {
    return {
      action: "nps_survey",
      ok: false,
      message: (err as Error).message ?? "NPS 큐잉 실패",
    };
  }
}

async function actionCalendarEntry(c: LoadedCase): Promise<CloseActionResult> {
  try {
    await prisma.caseEvent.create({
      data: {
        caseId: c.id,
        eventType: "CALENDAR_CLOSE_ADDED",
        actorName: "system",
        message: `종결 캘린더 항목 등록 (${new Date().toISOString().slice(0, 10)})`,
      },
    });
    return { action: "calendar_entry", ok: true, message: "캘린더에 종결 항목을 기록했습니다." };
  } catch (err) {
    return {
      action: "calendar_entry",
      ok: false,
      message: (err as Error).message ?? "캘린더 등록 실패",
    };
  }
}

async function actionArchiveDocuments(c: LoadedCase): Promise<CloseActionResult> {
  try {
    const key = "one_click_close.archive_queue";
    const queue = await readJson<Array<{ caseId: string; docCount: number; queuedAt: string }>>(
      key,
      [],
    );
    queue.unshift({
      caseId: c.id,
      docCount: c.requiredDocuments.length,
      queuedAt: new Date().toISOString(),
    });
    await writeJson(key, queue.slice(0, 500));
    await prisma.caseEvent.create({
      data: {
        caseId: c.id,
        eventType: "DOCUMENTS_ARCHIVED",
        actorName: "system",
        message: `문서 ${c.requiredDocuments.length}건 아카이브 큐 등록`,
      },
    });
    return {
      action: "archive_documents",
      ok: true,
      message: `문서 ${c.requiredDocuments.length}건 아카이브를 예약했습니다.`,
    };
  } catch (err) {
    return {
      action: "archive_documents",
      ok: false,
      message: (err as Error).message ?? "아카이브 실패",
    };
  }
}

async function actionReengagementSchedule(c: LoadedCase): Promise<CloseActionResult> {
  try {
    const client = c.parties[0];
    if (!client?.email) {
      return {
        action: "reengagement_schedule",
        ok: false,
        message: "의뢰인 이메일이 없어 리인게이지 스케줄을 건너뛰었습니다.",
      };
    }
    const key = "one_click_close.reengagement_queue";
    const queue = await readJson<
      Array<{ caseId: string; email: string; scheduledFor: string }>
    >(key, []);
    // 90일 후 예정
    const scheduledFor = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    queue.unshift({ caseId: c.id, email: client.email, scheduledFor });
    await writeJson(key, queue.slice(0, 500));
    return {
      action: "reengagement_schedule",
      ok: true,
      message: `90일 후 리인게이지 예약을 등록했습니다.`,
      detail: { scheduledFor },
    };
  } catch (err) {
    return {
      action: "reengagement_schedule",
      ok: false,
      message: (err as Error).message ?? "리인게이지 예약 실패",
    };
  }
}

const ACTION_HANDLERS: Record<
  CloseAction,
  (c: LoadedCase, actor: string | null) => Promise<CloseActionResult>
> = {
  status_closed: (c, actor) => actionStatusClosed(c, actor),
  closing_report: (c) => actionClosingReport(c),
  final_invoice: (c) => actionFinalInvoice(c),
  nps_survey: (c) => actionNpsSurvey(c),
  calendar_entry: (c) => actionCalendarEntry(c),
  archive_documents: (c) => actionArchiveDocuments(c),
  reengagement_schedule: (c) => actionReengagementSchedule(c),
};

export async function runCloseFlow(input: CloseFlowInput): Promise<CloseFlowResult> {
  const enabled = await isFeatureEnabled("one_click_close").catch(() => true);
  if (!enabled) {
    throw new Error("one_click_close 기능이 비활성화되어 있습니다.");
  }
  const c = await loadCase(input.caseId);
  if (!c) throw new Error("사건을 찾을 수 없습니다.");

  const actions = input.actions?.length ? input.actions : ALL_CLOSE_ACTIONS;
  const actor = input.actorName ?? "admin";
  const results: CloseActionResult[] = [];

  for (const a of actions) {
    const handler = ACTION_HANDLERS[a];
    if (!handler) {
      results.push({ action: a, ok: false, message: "알 수 없는 액션" });
      continue;
    }
    try {
      const r = await handler(c, actor);
      results.push(r);
    } catch (err) {
      logger.warn(`[one-click-close] action ${a} 실패`, err);
      results.push({ action: a, ok: false, message: (err as Error).message ?? "실패" });
    }
  }

  const reportItem = results.find((r) => r.action === "closing_report" && r.ok);
  const reportUrl =
    (reportItem?.detail?.reportUrl as string | undefined) ?? `/api/admin/cases/${c.id}/report`;

  const summary: CloseFlowResult = {
    caseId: c.id,
    triggeredAt: new Date().toISOString(),
    actions: results,
    reportUrl,
  };

  try {
    await appendLog(summary);
  } catch (err) {
    logger.warn("[one-click-close] 로그 기록 실패", err);
  }

  return summary;
}

export async function getRecentCloseFlowLog(limit = 20): Promise<CloseFlowResult[]> {
  const list = await readJson<CloseFlowResult[]>(LOG_KEY, []);
  return list.slice(0, limit);
}
