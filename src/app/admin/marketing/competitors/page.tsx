import {
  buildComparisonHints,
  listCompetitors,
  loadEthosPricing,
} from "@/lib/services/competitor-tracker-service";

import { CompetitorEditor } from "./competitor-editor";

export const dynamic = "force-dynamic";

export default async function AdminCompetitorsPage() {
  const [competitors, ethos, hints] = await Promise.all([
    listCompetitors(),
    loadEthosPricing(),
    buildComparisonHints(),
  ]);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div>
        <p className="ui-kicker">마케팅 · 경쟁사 벤치마킹</p>
        <h2 className="mt-2 text-xl font-semibold text-text-strong">경쟁사 트래커 (수동 큐레이션)</h2>
        <p className="mt-2 text-sm text-text-muted">
          공개 자료를 수동으로 정리해 ETHOS 가격과 나란히 비교합니다. 자동 스크래핑은 하지 않습니다.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CompetitorEditor initial={competitors} />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">ETHOS 가격 (FeeItem)</p>
          <div className="mt-3 max-h-80 overflow-y-auto text-xs">
            {ethos.length === 0 ? (
              <p className="text-text-muted">FeeItem 데이터가 없습니다.</p>
            ) : (
              <ul className="space-y-1">
                {ethos.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 border-b border-line/60 py-1">
                    <span>
                      <span className="text-text-muted">[{e.category}]</span> {e.service}
                    </span>
                    <span className="whitespace-nowrap font-semibold">{e.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-text-strong">가격 비교 인사이트</h3>
        <p className="mt-1 text-xs text-text-muted">
          경쟁사의 가격 문자열에서 대략적인 금액을 추출해 ETHOS와 비교한 결과입니다. 참고용 지표이며 정확한 견적은 아닙니다.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/40 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">비교 대상</th>
                <th className="px-3 py-2 text-right">경쟁사 가격</th>
                <th className="px-3 py-2 text-right">ETHOS 가격</th>
                <th className="px-3 py-2 text-left">인사이트</th>
              </tr>
            </thead>
            <tbody>
              {hints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                    비교할 수 있는 데이터가 없습니다. 경쟁사 서비스에 가격을 입력해 주세요.
                  </td>
                </tr>
              ) : (
                hints.map((h, i) => {
                  const cheaper = h.diffPct > 0;
                  const abs = Math.abs(h.diffPct).toFixed(1);
                  return (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-2">{h.serviceKey}</td>
                      <td className="px-3 py-2 text-right">
                        ₩{h.competitorPrice.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ₩{h.ethosPrice.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-3 py-2">
                        ETHOS 가격이 {h.competitorName} 대비{" "}
                        <span className={cheaper ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
                          {abs}% {cheaper ? "저렴" : "비쌈"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
