import type { Metadata } from "next";

import { ServicePage } from "@/components/public/service-page";
import { getSiteSetting } from "@/lib/services/site-settings";
import { LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비자/외국인 체류 — 에토스 행정사사무소(ETHOS)",
  description: "체류 자격 변경·연장, 사업/투자 비자, 강제퇴거 대응까지 한 흐름으로 정리합니다."
};

export default async function VisaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const descOverride = await getSiteSetting("services.immigration.desc");
  return (
    <>
      <LegalServiceJsonLd
        serviceName="비자 / 외국인 체류"
        description="체류 자격 변경, 기간 연장, 초청, 영주·국적 신청, 강제퇴거 처분 대응"
        url="/services/immigration"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "업무분야", url: "/services" },
          { name: "비자/체류", url: "/services/immigration" },
        ]}
      />
    <ServicePage
      lang={lang}
      serviceKey="immigration"
      descriptionOverride={descOverride}
      data={{
        kicker: "Visa & Immigration",
        title: "비자 / 외국인 체류",
        tagline: "체류의 흐름을 한 번에 정리합니다",
        description:
          "체류 자격 변경, 기간 연장, 초청, 영주·국적 신청, 강제퇴거 처분 대응까지 출입국 업무 전반을 함께 합니다. 사안의 사실관계와 제출 자료를 먼저 확인합니다.",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        ),
        whoFor: [
          "체류 자격 변경 / 기간 연장이 필요한 분",
          "사업 / 투자 / 고용 관련 비자가 필요한 분",
          "강제퇴거 / 출국명령 처분을 받은 분",
          "영주 / 국적 신청을 준비 중인 분",
          "초청 (사증발급인정서) 절차가 필요한 분",
          "체류 관련 보완 요청을 받은 분"
        ],
        process: [
          { step: "01", title: "사실관계 확인", desc: "여권, 체류카드, 이전 처분 내역 등 기초 확인" },
          { step: "02", title: "자격 요건 검토", desc: "현재 자격·신청하려는 자격의 요건 비교" },
          { step: "03", title: "서류 준비 안내", desc: "관청별 필수·권장 자료 정리" },
          { step: "04", title: "신청 및 결과 추적", desc: "접수 후 보완 요청 대응까지" }
        ],
        documents: [
          "여권 사본 (인적사항면)",
          "외국인등록증 사본",
          "체류 자격 관련 증빙 (재직증명서, 사업자등록증 등)",
          "거주지 증빙 (임대차계약서, 가족관계 자료 등)",
          "이전 처분서 / 통지서 (해당 시)"
        ],
        deadlines: [
          { label: "체류기간 연장 신청", value: "만료 4개월 전 ~ 만료일까지" },
          { label: "자격 변경 신청", value: "현재 체류기간 내" },
          { label: "강제퇴거 불복", value: "처분 통지 후 14일 이내" }
        ],
        faq: [
          { q: "체류기간이 곧 만료되는데 가능한가요?", a: "만료일 전 신청이 원칙입니다. 사안에 따라 가능 범위를 먼저 확인합니다." },
          { q: "F-2 자격 변경 요건이 궁금합니다.", a: "점수제 평가 항목과 필요 자료가 사안마다 다릅니다. 사실관계 확인 후 안내합니다." },
          { q: "강제퇴거 처분을 받았습니다.", a: "처분서·통지일을 먼저 확인해 불복 가능 범위와 자료를 검토합니다." },
          { q: "외국인 직원 고용 비자를 알아보고 있어요.", a: "업종, 직무, 자격증 요건 등을 사전 검토 후 가능한 비자 종류를 안내합니다." }
        ]
      }}
    />
    </>
  );
}
