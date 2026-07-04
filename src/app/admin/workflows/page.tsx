import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { WorkflowRuleEditor } from "@/components/admin/workflow-rule-editor";
import { loadWorkflowRules } from "@/lib/services/workflow-engine";

export const dynamic = "force-dynamic";

export default async function WorkflowsAdminPage() {
  const rules = await loadWorkflowRules();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Automation"
        title="사건 진행 자동화 워크플로"
        description="문의/사건 상태 전환 시 자동 실행되는 액션을 관리합니다. SiteSetting(workflow.rules)에 JSON 배열로 저장됩니다."
      />

      <Card className="p-4">
        <p className="ui-kicker">지원 액션</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-text-muted">
          <li><b>sendTelegram</b> — 관리자 텔레그램에 알림 (params: title, channel)</li>
          <li><b>sendEmail</b> — 의뢰인 이메일 전송 (params: subject, body). Resend 필요.</li>
          <li><b>createReminder</b> — CaseTask 생성 (params: delayDays, title, taskType, recurring)</li>
          <li><b>requestDocuments</b> — 자료 요청 태스크 생성 (params: note)</li>
          <li><b>logNote</b> — 로그만 기록 (params: note)</li>
        </ul>
      </Card>

      <WorkflowRuleEditor initialRules={rules} />
    </div>
  );
}
