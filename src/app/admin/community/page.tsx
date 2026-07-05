import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { listQuestions } from "@/lib/services/community-service";
import { CommunityAdminList } from "./community-admin-list";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const [pending, answered, spam] = await Promise.all([
    listQuestions({ status: "PENDING", perPage: 50 }),
    listQuestions({ status: "ANSWERED", perPage: 50 }),
    listQuestions({ status: "SPAM", perPage: 30 }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Community"
        title="Q&A 모더레이션"
        description="공개 커뮤니티 질문을 답변하거나 스팸 처리하고, 우수 Q&A는 블로그 초안으로 승격합니다."
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="rounded bg-warning/10 px-3 py-2 font-semibold text-warning">
            대기 {pending.total}
          </span>
          <span className="rounded bg-success/10 px-3 py-2 font-semibold text-success">
            답변됨 {answered.total}
          </span>
          <span className="rounded bg-surface-muted px-3 py-2 text-text-muted">
            스팸 {spam.total}
          </span>
        </div>
      </Card>

      <CommunityAdminList
        pending={pending.items}
        answered={answered.items}
        spam={spam.items}
      />
    </div>
  );
}
