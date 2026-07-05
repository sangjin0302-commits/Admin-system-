import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import {
  listApplications,
  CAREER_STATUS_LABEL,
  CAREER_TRACK_LABEL,
  type CareerStatus,
} from "@/lib/services/career-application-service";
import { CareersAdminList } from "./careers-admin-list";

export const dynamic = "force-dynamic";

const STATUS_ORDER: CareerStatus[] = ["new", "review", "interview", "hired", "rejected"];

export default async function AdminCareersPage() {
  const items = await listApplications();

  const counts: Record<CareerStatus, number> = {
    new: 0,
    review: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  };
  for (const it of items) counts[it.status] = (counts[it.status] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Careers"
        title="채용/멘토링 지원자"
        description="공개 지원 폼(/careers)으로 접수된 지원자를 관리합니다."
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 text-xs">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="rounded-md bg-surface-muted px-3 py-2">
              <span className="font-semibold text-text-strong">{CAREER_STATUS_LABEL[s]}</span>
              <span className="ml-2 text-text-muted">{counts[s]}</span>
            </div>
          ))}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          아직 지원자가 없습니다.
        </Card>
      ) : (
        <CareersAdminList
          initialItems={items.map((it) => ({
            ...it,
            trackLabel: CAREER_TRACK_LABEL[it.track],
          }))}
        />
      )}
    </div>
  );
}
