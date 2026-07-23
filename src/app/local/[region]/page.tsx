/**
 * SS2: 지역 SEO 랜딩 — /local/[region]
 *
 * 서울 25구 + 수도권 주요 시. "강남구 행정사" 등 로컬 검색 유입용.
 * Feature flag: `local_seo_landing`
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const revalidate = 3600;

const REGIONS: Record<string, { name: string; nearby: string[] }> = {
  gangnam: { name: "강남구", nearby: ["서초구", "송파구"] },
  seocho: { name: "서초구", nearby: ["강남구", "동작구"] },
  songpa: { name: "송파구", nearby: ["강남구", "강동구"] },
  gangdong: { name: "강동구", nearby: ["송파구", "광진구"] },
  gwangjin: { name: "광진구", nearby: ["성동구", "강동구"] },
  seongdong: { name: "성동구", nearby: ["광진구", "동대문구"] },
  dongdaemun: { name: "동대문구", nearby: ["성동구", "중랑구"] },
  jungnang: { name: "중랑구", nearby: ["동대문구", "노원구"] },
  nowon: { name: "노원구", nearby: ["도봉구", "중랑구"] },
  dobong: { name: "도봉구", nearby: ["노원구", "강북구"] },
  gangbuk: { name: "강북구", nearby: ["도봉구", "성북구"] },
  seongbuk: { name: "성북구", nearby: ["강북구", "종로구"] },
  jongno: { name: "종로구", nearby: ["중구", "성북구"] },
  junggu: { name: "중구", nearby: ["종로구", "용산구"] },
  yongsan: { name: "용산구", nearby: ["중구", "마포구"] },
  mapo: { name: "마포구", nearby: ["용산구", "서대문구"] },
  seodaemun: { name: "서대문구", nearby: ["마포구", "은평구"] },
  eunpyeong: { name: "은평구", nearby: ["서대문구", "마포구"] },
  yangcheon: { name: "양천구", nearby: ["강서구", "구로구"] },
  gangseo: { name: "강서구", nearby: ["양천구", "영등포구"] },
  guro: { name: "구로구", nearby: ["양천구", "금천구"] },
  geumcheon: { name: "금천구", nearby: ["구로구", "관악구"] },
  yeongdeungpo: { name: "영등포구", nearby: ["강서구", "동작구"] },
  dongjak: { name: "동작구", nearby: ["영등포구", "관악구"] },
  gwanak: { name: "관악구", nearby: ["동작구", "금천구"] },
  suwon: { name: "수원시", nearby: ["용인시", "안양시"] },
  yongin: { name: "용인시", nearby: ["수원시", "성남시"] },
  seongnam: { name: "성남시", nearby: ["용인시", "하남시"] },
  goyang: { name: "고양시", nearby: ["파주시", "김포시"] },
  bucheon: { name: "부천시", nearby: ["인천", "김포시"] },
  incheon: { name: "인천", nearby: ["부천시", "김포시"] },
};

const SERVICES = [
  { title: "비자 / 외국인 체류", href: "/services/immigration", desc: "체류 연장·자격 변경·영주·국적, 강제퇴거 대응" },
  { title: "행정심판", href: "/services/appeal", desc: "영업정지·면허취소 등 처분 불복, 청구기한 90일 관리" },
  { title: "계약서 / 사실조사", href: "/services/contract", desc: "계약 검토·작성, 분쟁 사실관계 조사보고서" },
  { title: "인허가", href: "/services/license", desc: "사업·건축·식품 인허가 신청과 보완 대응" },
] as const;

export function generateStaticParams() {
  return Object.keys(REGIONS).map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const info = REGIONS[region];
  if (!info) return {};
  return {
    title: `${info.name} 행정사 — 비자·행정심판·인허가 | 에토스 행정사사무소(ETHOS)`,
    description: `${info.name} 및 인근 지역 비자/체류, 행정심판, 인허가, 계약서 업무. 무료 검토로 가능성과 예상 비용을 먼저 확인하세요. 영업일 24시간 내 회신.`,
    alternates: { canonical: `/local/${region}` },
  };
}

export default async function LocalRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const info = REGIONS[region];
  if (!info) notFound();
  if (!(await isFeatureEnabled("local_seo_landing"))) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: "ETHOS 행정사사무소",
    areaServed: [info.name, ...info.nearby],
    url: `https://ethos-lawfirm.com/local/${region}`,
    priceRange: "₩₩",
  };

  const nearbySlugs = Object.entries(REGIONS).filter(([, v]) => info.nearby.includes(v.name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="ethos-eyebrow text-gold-deep">LOCAL · {info.name}</p>
      <h1 className="ethos-display mt-3 text-3xl sm:text-5xl">
        {info.name} 행정사를 찾고 계신가요?
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-text-muted">
        ETHOS 행정사사무소는 {info.name}을 포함한 수도권 전역의 비자·체류, 행정심판, 인허가, 계약 업무를
        온라인 중심으로 진행합니다. 방문 없이 접수부터 결과 확인까지 — 무료 검토로 가능성과 예상 비용을 먼저 확인하세요.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/intake" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:brightness-110">
          무료 검토 신청 →
        </Link>
        <Link href="/quick-check" className="rounded-full border border-gold/50 px-6 py-3 text-sm font-medium text-primary hover:bg-gold-soft/30">
          30초 AI 사전 진단
        </Link>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <Link key={s.href} href={s.href} className="ethos-card block p-6 transition hover:shadow-floating">
            <h2 className="text-lg font-bold text-text-strong">{s.title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">{s.desc}</p>
            <span className="mt-3 inline-block text-xs font-medium text-gold-deep">자세히 보기 →</span>
          </Link>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-line bg-surface-muted p-6">
        <h2 className="text-sm font-bold text-text-strong">{info.name} 인근 지역도 함께 봅니다</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {nearbySlugs.map(([slug, v]) => (
            <Link key={slug} href={`/local/${slug}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-text-muted hover:text-primary">
              {v.name} 행정사
            </Link>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-text-muted">
          ※ 온라인 접수 기반으로 전국 어디서든 동일한 품질의 업무 진행이 가능합니다. 사안별 검토가 필요하며,
          기관 제출 방식은 공식 기준 확인 후 안내드립니다.
        </p>
      </div>
    </div>
  );
}
