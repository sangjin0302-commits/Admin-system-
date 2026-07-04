import type { ReactNode } from "react";

type Row = {
  label: string;
  ethos: ReactNode;
  lawyer: ReactNode;
  self: ReactNode;
};

const ROWS: readonly Row[] = [
  { label: "비용", ethos: "33~200만원", lawyer: "300~800만원", self: "0원" },
  { label: "소요 기간", ethos: "2~8주", lawyer: "4~16주", self: "2~24주" },
  { label: "성공률", ethos: "85%", lawyer: "90%", self: "40%" },
  { label: "서류 검토", ethos: "포함", lawyer: "별도 청구", self: "없음" },
  { label: "사후 관리", ethos: "포함", lawyer: "별도 계약", self: "없음" },
  { label: "재도전 지원", ethos: "무료 1회", lawyer: "유료", self: "없음" },
];

export function ComparisonTable() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="comparison-table-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="ethos-eyebrow">Service Comparison</p>
          <h2
            id="comparison-table-heading"
            className="ethos-display mt-3 text-2xl sm:text-3xl"
          >
            행정사 · 변호사 · 셀프 진행 비교
          </h2>
          <p className="mt-3 text-sm text-text-muted">
            같은 사안, 세 가지 진행 방식을 한 표로 비교해 보세요.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-gold/30 bg-surface shadow-sm">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gold/30 bg-surface-muted/40">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-surface-muted/60 px-3 py-4 font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted sm:px-5"
                >
                  항목
                </th>
                <th
                  scope="col"
                  className="relative px-3 py-4 text-center font-serif text-sm font-bold text-primary sm:px-5 sm:text-base"
                  style={{ backgroundColor: "rgb(250 243 220)" }}
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 font-serif text-[10px] font-bold uppercase tracking-wider text-gold-soft shadow-sm">
                    추천
                  </span>
                  <span className="block text-gold-deep">행정사</span>
                  <span className="mt-0.5 block font-serif text-[10px] font-bold tracking-[0.25em] text-primary/80">
                    ETHOS
                  </span>
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-center font-serif text-sm font-bold text-text sm:px-5 sm:text-base"
                >
                  변호사 선임
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-center font-serif text-sm font-bold text-text sm:px-5 sm:text-base"
                >
                  셀프 진행
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={
                    i === ROWS.length - 1
                      ? ""
                      : "border-b border-gold/15"
                  }
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-3 py-3.5 text-[13px] font-semibold text-text sm:px-5 sm:text-sm"
                  >
                    {row.label}
                  </th>
                  <td
                    className="px-3 py-3.5 text-center text-[13px] font-bold text-gold-deep sm:px-5 sm:text-sm"
                    style={{ backgroundColor: "rgb(250 243 220)" }}
                  >
                    {row.ethos}
                  </td>
                  <td className="px-3 py-3.5 text-center text-[13px] text-text-muted sm:px-5 sm:text-sm">
                    {row.lawyer}
                  </td>
                  <td className="px-3 py-3.5 text-center text-[13px] text-text-muted sm:px-5 sm:text-sm">
                    {row.self}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-[11px] leading-5 text-text-muted">
          ※ 비용·기간·성공률은 사안 유형과 난이도에 따라 달라질 수 있으며, 결과를 보장하지 않습니다.
        </p>
      </div>
    </section>
  );
}
