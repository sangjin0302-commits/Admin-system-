import { listPrecedents } from "@/lib/services/precedent-database-service";
import { PrecedentsAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminPrecedentsPage() {
  const precedents = await listPrecedents();
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Knowledge</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">행정심판 판례 DB</h2>
      <p className="mt-2 text-sm text-text-muted">
        판례를 검색·추가하고 Lawbot과 동기화합니다.
      </p>
      <div className="mt-6">
        <PrecedentsAdminClient initial={precedents} />
      </div>
    </section>
  );
}
