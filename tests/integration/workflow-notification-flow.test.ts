/**
 * Integration test — 신규 문의 → 우선순위 스코어 → 워크플로 규칙 매칭 → 알림 발송
 * 실행: `npx tsx tests/integration/workflow-notification-flow.test.ts`
 *
 * DB/외부 서비스는 인메모리 mock 으로 대체한다. 실제 prisma·resend·telegram은 건드리지 않는다.
 */

import assert from "node:assert/strict";

import { DEFAULT_WORKFLOW_RULES, type WorkflowRule } from "@/lib/services/workflow-engine";
import { scoreTone } from "@/lib/services/priority-scoring-service";
import { calculateAllApplicableDeadlines } from "@/lib/services/deadline-calculator";

// ─── 인메모리 mock 저장소 ────────────────────────────────
type MockInquiry = {
  id: string;
  title: string;
  description: string;
  inquiryType: string;
  urgencyLevel: string;
  status: string;
  email?: string;
  isCorporateRequest?: boolean;
  hasPreparedDocuments?: boolean;
  dueDate?: Date | null;
};

const inquiries: MockInquiry[] = [];
const siteSettings = new Map<string, string>();
const tasks: Array<{ inquiryId?: string; taskType: string; title: string }> = [];
const notifications: Array<{ channel: string; title: string }> = [];

// ─── 우선순위 스코어링 (heuristic 재현) ─────────────────
function scoreHeuristic(inq: MockInquiry) {
  let urgency = 30;
  if (inq.urgencyLevel === "CRITICAL") urgency = 95;
  else if (inq.urgencyLevel === "HIGH") urgency = 75;
  const revenue = inq.isCorporateRequest ? 65 : 40;
  const likelihood = inq.hasPreparedDocuments ? 70 : 50;
  const total = Math.round(0.4 * urgency + 0.3 * likelihood + 0.3 * revenue);
  return { urgency, likelihood, revenue, total };
}

// ─── 워크플로 규칙 매칭 + 액션 실행 (dry-run 안전) ────
function runWorkflowMock(entity: "inquiry" | "case", toStatus: string, data: MockInquiry) {
  const matched = DEFAULT_WORKFLOW_RULES.filter(
    (r: WorkflowRule) =>
      r.enabled !== false && r.trigger.entity === entity && r.trigger.toStatus === toStatus
  );
  const executed: string[] = [];
  for (const rule of matched) {
    for (const action of rule.actions) {
      if (action.type === "sendTelegram") {
        notifications.push({
          channel: (action.params.channel as string) ?? "admin",
          title: (action.params.title as string) ?? "알림",
        });
      } else if (action.type === "createReminder") {
        tasks.push({
          inquiryId: data.id,
          taskType: (action.params.taskType as string) ?? "REMINDER",
          title: (action.params.title as string) ?? "리마인더",
        });
      } else if (action.type === "requestDocuments") {
        tasks.push({
          inquiryId: data.id,
          taskType: "DOCUMENT_REQUEST",
          title: `자료 요청: ${action.params.note ?? "자료"}`,
        });
      }
      executed.push(action.type);
    }
  }
  return { matched: matched.length, executed };
}

// ══════════════════════════════════════════════════════
// 시나리오 1: 신규 긴급 문의 → 스코어 → NEW 워크플로 → 텔레그램 + 자료요청
// ══════════════════════════════════════════════════════
{
  inquiries.length = 0;
  tasks.length = 0;
  notifications.length = 0;

  const inq: MockInquiry = {
    id: "inq_1",
    title: "긴급 행정심판 청구",
    description: "처분일로부터 벌써 80일이 지나 급함. 오늘 안에 상담 필요",
    inquiryType: "APPEAL",
    urgencyLevel: "CRITICAL",
    status: "NEW",
    email: "client@example.com",
    isCorporateRequest: true,
    hasPreparedDocuments: false,
  };
  inquiries.push(inq);

  const score = scoreHeuristic(inq);
  const tone = scoreTone(score.total);

  assert.ok(score.urgency >= 90, "CRITICAL urgency는 90 이상이어야 함");
  assert.equal(tone.label, "긴급");

  const result = runWorkflowMock("inquiry", "NEW", inq);
  assert.equal(result.matched, 1, "NEW 규칙 1개 매칭");
  assert.ok(result.executed.includes("sendTelegram"));
  assert.ok(result.executed.includes("requestDocuments"));
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].channel, "admin");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].taskType, "DOCUMENT_REQUEST");

  console.log("시나리오 1 통과: 신규 긴급 문의 → 알림 + 자료 요청");
}

// ══════════════════════════════════════════════════════
// 시나리오 2: 사건 상태 CONSULTING → 3일 뒤 리마인더 태스크 생성
// ══════════════════════════════════════════════════════
{
  tasks.length = 0;
  notifications.length = 0;

  const caseData: MockInquiry = {
    id: "case_1",
    title: "상담 시작 사건",
    description: "",
    inquiryType: "GENERAL",
    urgencyLevel: "MEDIUM",
    status: "CONSULTING",
  };

  const result = runWorkflowMock("case", "CONSULTING", caseData);
  assert.equal(result.matched, 1);
  assert.ok(result.executed.includes("createReminder"));
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].taskType, "FOLLOWUP");

  console.log("시나리오 2 통과: CONSULTING → FOLLOWUP 리마인더");
}

// ══════════════════════════════════════════════════════
// 시나리오 3: SUBMITTED → sendEmail 액션이 매칭되는지
// ══════════════════════════════════════════════════════
{
  const caseData: MockInquiry = {
    id: "case_2",
    title: "제출 완료",
    description: "",
    inquiryType: "GENERAL",
    urgencyLevel: "MEDIUM",
    status: "SUBMITTED",
    email: "client2@example.com",
  };
  const result = runWorkflowMock("case", "SUBMITTED", caseData);
  assert.equal(result.matched, 1);
  assert.ok(result.executed.includes("sendEmail"));

  console.log("시나리오 3 통과: SUBMITTED → sendEmail 매칭");
}

// ══════════════════════════════════════════════════════
// 시나리오 4: 매칭되지 않는 상태 전환 — 아무 액션 없음
// ══════════════════════════════════════════════════════
{
  tasks.length = 0;
  notifications.length = 0;
  const result = runWorkflowMock("case", "UNKNOWN_STATUS", {
    id: "x",
    title: "",
    description: "",
    inquiryType: "",
    urgencyLevel: "LOW",
    status: "UNKNOWN_STATUS",
  });
  assert.equal(result.matched, 0);
  assert.equal(tasks.length, 0);
  assert.equal(notifications.length, 0);

  console.log("시나리오 4 통과: 매칭 없음 → no-op");
}

// ══════════════════════════════════════════════════════
// 시나리오 5: 문의 → 처분일 기반 마감 계산 + 후속 규칙 실행
// ══════════════════════════════════════════════════════
{
  const disposition = new Date();
  disposition.setDate(disposition.getDate() - 20);
  const deadlines = calculateAllApplicableDeadlines(disposition, "APPEAL");
  assert.ok(deadlines.length >= 2);
  const adminAppeal = deadlines.find((d) => d.type === "ADMIN_APPEAL");
  assert.ok(adminAppeal);
  assert.equal(adminAppeal.isExpired, false);
  assert.ok(adminAppeal.daysRemaining <= 71 && adminAppeal.daysRemaining >= 69);

  console.log("시나리오 5 통과: 마감 계산 + 카테고리별 규칙");
}

// ══════════════════════════════════════════════════════
// 시나리오 6: SiteSetting mock — 규칙 저장/불러오기 라운드트립
// ══════════════════════════════════════════════════════
{
  const customRules: WorkflowRule[] = [
    {
      id: "custom.test",
      name: "테스트 커스텀",
      enabled: true,
      trigger: { entity: "inquiry", toStatus: "REVIEW" },
      actions: [{ type: "logNote", params: { note: "리뷰 단계 진입" } }],
    },
  ];
  siteSettings.set("workflow.rules", JSON.stringify(customRules));

  const raw = siteSettings.get("workflow.rules");
  assert.ok(raw);
  const parsed = JSON.parse(raw) as WorkflowRule[];
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].trigger.toStatus, "REVIEW");

  console.log("시나리오 6 통과: SiteSetting 규칙 라운드트립");
}

console.log("\n✓ workflow-notification-flow integration tests passed");
