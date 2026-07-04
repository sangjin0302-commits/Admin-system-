import Link from "next/link";

import { listLandings } from "@/lib/services/landing-page-service";

import { CreateLandingForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function AdminLandingListPage() {
  const landings = await listLandings();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">마케팅</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">랜딩 페이지 빌더</h2>
      <p className="mt-2 text-sm text-text-muted">
        키워드별 랜딩 페이지를 만들어 <code>/l/&lt;slug&gt;</code> 로 노출합니다. CTA는 자동으로{" "}
        <code>utm_source=landing_&lt;slug&gt;</code> 를 붙여 intake로 연결합니다.
      </p>

      <div className="mt-6">
        <CreateLandingForm />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-text-strong">등록된 랜딩 ({landings.length})</h3>
        {landings.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 랜딩 페이지가 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {landings.map((l) => (
              <li key={l.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-strong">{l.title}</p>
                  <p className="text-xs text-text-muted">
                    <code>/l/{l.slug}</code> · 블록 {l.blocks.length}개 · 수정 {new Date(l.updatedAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <Link
                    href={`/l/${l.slug}`}
                    target="_blank"
                    className="rounded border border-line px-3 py-1.5"
                  >
                    미리보기
                  </Link>
                  <Link
                    href={`/admin/landing/${l.slug}`}
                    className="rounded border border-primary bg-primary px-3 py-1.5 font-semibold text-white"
                  >
                    편집
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
