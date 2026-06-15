import { listAdminCredentials } from "@/lib/services/credentials";

import { CredentialsManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminCredentialsPage() {
  const items = await listAdminCredentials();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">대표 경력 / 자격 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        여기에 입력한 경력·자격·학력은 <strong>사무소 소개(About) 페이지</strong>에 연혁으로 노출됩니다. 비워두면 기본 연혁이 표시됩니다.
      </p>

      <div className="mt-6">
        <CredentialsManager
          initialItems={items.map((i) => ({
            id: i.id,
            type: i.type,
            year: i.year,
            title: i.title,
            detail: i.detail,
            published: i.published
          }))}
        />
      </div>
    </section>
  );
}
