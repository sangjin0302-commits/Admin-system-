import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "비용 안내 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 수임 비용 안내와 결제 방식."
};

type FeeRow = {
  category: string;
  service: string;
  range: string;
  note: string;
};

const FEES: readonly FeeRow[] = [
  { category: "비자/체류", service: "체류 자격 변경", range: "사안별 협의", note: "자격 / 사실관계 검토 후 견적" },
  { category: "비자/체류", service: "체류 기간 연장", range: "사안별 협의", note: "표준 진행 시 정액" },
  { category: "비자/체류", service: "강제퇴거 대응", range: "사안별 협의", note: "긴급도 / 자료 범위에 따라" },
  { category: "행정심판", service: "심판 청구 및 진행", range: "사안별 협의", note: "기본 + 단계별 추가" },
  { category: "행정심판", service: "이의신청", range: "사안별 협의", note: "" },
  { category: "계약서/사실조사", service: "계약서 작성 / 검토", range: "사안별 협의", note: "검토 단독 / 작성 단독 / 통합" },
  { category: "계약서/사실조사", service: "사실조사 보고서", range: "사안별 협의", note: "조사 범위에 따라" },
  { category: "인허가", service: "허가 신청", range: "사안별 협의", note: "허가 유형 / 보완 가능성 검토" },
  { category: "인허가", service: "보완 / 불복 대응", range: "사안별 협의", note: "" }
];

export default function FeesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Transparent Fees</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">비용 안내</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
          사안의 복잡도, 자료 범위, 진행 단계에 따라 비용이 달라집니다.
          상담 단계에서 명확한 견적을 안내드립니다.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/60">
            <tr className="border-b border-gold/30 text-left font-serif text-xs uppercase tracking-wider text-gold-deep">
              <th className="px-5 py-4">분야</th>
              <th className="px-5 py-4">업무</th>
              <th className="px-5 py-4">비용 범위</th>
              <th className="hidden px-5 py-4 lg:table-cell">비고</th>
            </tr>
          </thead>
          <tbody>
            {FEES.map((f, i) => (
              <tr key={i} className="border-b border-gold/15 last:border-0">
                <td className="px-5 py-4 font-serif text-xs font-bold text-gold-deep">{f.category}</td>
                <td className="px-5 py-4 font-bold text-text-strong">{f.service}</td>
                <td className="px-5 py-4 text-text-muted">{f.range}</td>
                <td className="hidden px-5 py-4 text-xs text-text-muted lg:table-cell">{f.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "투명한 견적", desc: "상담 후 명확한 견적서를 안내드립니다." },
          { title: "단계별 정산", desc: "착수금 / 중간 / 완수 단계로 나눠 정산합니다." },
          { title: "결제 방법", desc: "계좌 이체 / 카드 / 가상계좌 사용 가능합니다." }
        ].map((p) => (
          <Card key={p.title} muted className="p-5">
            <h3 className="font-serif text-base font-bold text-primary">{p.title}</h3>
            <p className="mt-2 text-xs leading-6 text-text-muted">{p.desc}</p>
          </Card>
        ))}
      </section>

      <Card className="p-7">
        <h3 className="font-serif text-lg font-bold text-primary">비용 산정 원칙</h3>
        <ul className="mt-4 space-y-2 text-sm text-text">
          {[
            "사안의 복잡도 / 자료 범위 / 긴급도에 따라 사전 협의합니다.",
            "단계별 진행 시 단계 종료마다 정산을 안내합니다.",
            "보장의 의미로 해석될 수 있는 표현은 사용하지 않습니다.",
            "관청 수수료 / 인지대 / 송달료 등 실비는 별도 부과됩니다.",
            "상담 단계에서 가능한 진행 범위와 한계를 안내합니다."
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
              {t}
            </li>
          ))}
        </ul>
      </Card>

      <section className="rounded-2xl bg-primary p-10 text-center text-white">
        <h2 className="font-serif text-2xl font-bold sm:text-3xl">상담 후 견적을 안내드립니다</h2>
        <p className="mt-3 text-sm text-white/80">사안을 듣고 가능한 진행 범위와 비용을 함께 확인합니다.</p>
        <Link
          href="/intake"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-gold px-6 font-bold text-primary transition hover:bg-gold-soft"
        >
          상담 신청
        </Link>
      </section>
    </div>
  );
}
