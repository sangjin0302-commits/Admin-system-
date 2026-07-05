import { listMeetings } from "@/lib/services/onsite-meeting-service";
import { OnsiteAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminOnsitePage() {
  const meetings = await listMeetings();
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Field Ops</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">온사이트 미팅 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        방문 상담 스케줄과 동선을 관리합니다.
      </p>
      <div className="mt-6">
        <OnsiteAdminClient initial={meetings} />
      </div>
    </section>
  );
}
