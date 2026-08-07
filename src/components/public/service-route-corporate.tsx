import { ServicePage } from "@/components/public/service-page";
import { getSiteSettings } from "@/lib/services/site-settings";
import { LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import type { PublicLocale } from "@/lib/i18n-locale";

export async function CorporateServiceRoute({ lang }: { lang: PublicLocale }) {
  const settings = await getSiteSettings();
  const descOverride = settings["services.corporate.desc"];
  const titleOverride = settings["services.corporate.title"];
  const taglineOverride = settings["services.corporate.tagline"];
  const whoForOverride = settings["services.corporate.whoFor"];
  const documentsOverride = settings["services.corporate.documents"];
  const faqOverride = settings["services.corporate.faq"];
  const processOverride = settings["services.corporate.process"];
  const deadlinesOverride = settings["services.corporate.deadlines"];
  const outcomesOverride = settings["services.corporate.outcomes"];
  const risksOverride = settings["services.corporate.risks"];
  return (
    <>
      <LegalServiceJsonLd
        serviceName="법인 설립"
        description="법인 설립 절차, 정관·등기 준비, 설립 후 인허가 연계"
        url="/services/corporate"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "업무분야", url: "/services" },
          { name: "법인 설립", url: "/services/corporate" },
        ]}
      />
    <ServicePage
      lang={lang}
      serviceKey="corporate"
      descriptionOverride={descOverride}
      titleOverride={titleOverride}
      taglineOverride={taglineOverride}
      whoForOverride={whoForOverride}
      documentsOverride={documentsOverride}
      faqOverride={faqOverride}
      processOverride={processOverride}
      deadlinesOverride={deadlinesOverride}
      outcomesOverride={outcomesOverride}
      risksOverride={risksOverride}
      data={{
        kicker: "Corporate Formation",
        title: "법인 설립",
        tagline: "설립부터 첫 인허가까지",
        description:
          "법인의 형태 결정, 정관 작성, 등기 준비부터 설립 이후 필요한 인허가 연계까지 — 사업의 시작을 한 흐름으로 정리합니다. 사실관계와 목적을 먼저 확인합니다.",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.3">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h.01M15 11h.01" />
          </svg>
        ),
        whoFor: [
          "법인 / 개인사업자 형태를 고민 중인 창업자",
          "정관 작성·설립 등기를 준비하는 분",
          "국내에 법인을 설립하려는 외국인 창업자",
          "설립 후 인허가가 필요한 분",
          "자본금·임원·사업목적 변경이 필요한 분"
        ],
        process: [
          { step: "01", title: "형태·구조 설계", desc: "법인 유형, 자본금, 주주, 사업목적" },
          { step: "02", title: "서류 준비", desc: "정관, 동의서, 등기 서류 일체" },
          { step: "03", title: "등기 신청", desc: "법원 설립등기 · 세무/사업자 신고" },
          { step: "04", title: "설립 후 연계", desc: "필요 인허가 및 다음 단계 안내" }
        ],
        documents: [
          "창업자 신분증 / 인감 정보",
          "자본금 및 지분 구성안",
          "상호(법인명) 및 사업목적",
          "본점 소재지 증빙 (임대차계약서 등)",
          "외국인 창업 시 관련 서류"
        ],
        deadlines: [
          { label: "설립 등기", value: "설립 결의 후 법정 기한 내" },
          { label: "사업자 등록", value: "사업 개시일로부터 20일 이내" },
          { label: "설립 후 인허가", value: "규제 업종 영위 전" }
        ],
        faq: [
          { q: "법인과 개인사업자 중 무엇이 유리한가요?", a: "세제·책임·신뢰도를 사안별로 비교해 안내합니다." },
          { q: "외국인도 한국에서 법인을 세울 수 있나요?", a: "비자/투자 요건을 검토 후 설립을 준비합니다." },
          { q: "설립까지 얼마나 걸리나요?", a: "법인 유형과 서류에 따라 다르며, 초기 검토 후 일정을 안내합니다." },
          { q: "설립 후 인허가도 함께 처리되나요?", a: "설립을 사업에 필요한 인허가까지 한 흐름으로 연계합니다." }
        ]
      }}
    />
    </>
  );
}
