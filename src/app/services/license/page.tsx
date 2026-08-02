import type { Metadata } from "next";

import { ServicePage } from "@/components/public/service-page";
import { getSiteSetting } from "@/lib/services/site-settings";
import { LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "인허가 — 에토스 행정사사무소(ETHOS)",
  description: "사업·건축·식품·의료 등 인허가 신청, 보완 대응, 불복 절차를 함께 합니다."
};

export default async function LicensePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const [descOverride, titleOverride, taglineOverride, whoForOverride] = await Promise.all([
    getSiteSetting("services.license.desc"),
    getSiteSetting("services.license.title"),
    getSiteSetting("services.license.tagline"),
    getSiteSetting("services.license.whoFor"),
  ]);
  return (
    <>
      <LegalServiceJsonLd
        serviceName="인허가"
        description="사업·건축·식품·의료 등 인허가 신청, 보완 대응, 불복 절차"
        url="/services/license"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "업무분야", url: "/services" },
          { name: "인허가", url: "/services/license" },
        ]}
      />
    <ServicePage
      lang={lang}
      serviceKey="license"
      descriptionOverride={descOverride}
      titleOverride={titleOverride}
      taglineOverride={taglineOverride}
      whoForOverride={whoForOverride}
      data={{
        kicker: "License & Permit",
        title: "인허가",
        tagline: "허가의 과정을 체계적으로 정리합니다",
        description:
          "사업·건축·식품·의료·환경 등 인허가 신청, 보완 요청 대응, 불허 처분 시 불복 절차까지 단계별로 관리합니다. 허가 관청별 기준과 처리기한을 사전 검토합니다.",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.4">
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
          </svg>
        ),
        whoFor: [
          "사업 / 건축 / 식품 등 허가가 필요한 분",
          "외국인 고용허가를 받으려는 사업주",
          "허가 보완 요청을 받으신 분",
          "불허 처분에 대해 불복하려는 분",
          "허가 갱신 / 변경 신고가 필요한 분"
        ],
        process: [
          { step: "01", title: "요건 사전 검토", desc: "허가 관청, 요건, 처리기한 확인" },
          { step: "02", title: "서류 준비", desc: "필수 / 권장 서류 정리 및 준비" },
          { step: "03", title: "신청 및 접수", desc: "관청 접수, 접수번호 관리" },
          { step: "04", title: "보완 / 결과 대응", desc: "보완 요청 대응, 불허 시 불복 검토" }
        ],
        documents: [
          "사업자등록증 / 법인등기부등본",
          "허가 신청서 양식",
          "사업장 임대차계약서 또는 소유 증빙",
          "도면 / 시설 사진 (해당 시)",
          "관련 자격증 / 면허증",
          "환경·소방·위생 자료 (해당 시)"
        ],
        deadlines: [
          { label: "허가 처리기한", value: "법령마다 다름 (일반적으로 7~30일)" },
          { label: "보완 회신 기한", value: "통지 후 통상 7~14일" },
          { label: "불허 처분 불복", value: "통지 후 90일 (행정심판 기한 준용)" }
        ],
        faq: [
          { q: "허가 가능 여부를 미리 알 수 있나요?", a: "사전 검토 단계에서 관청 기준과 사안을 비교해 가능 범위를 안내합니다." },
          { q: "보완 요청이 들어왔어요.", a: "요청 내용과 미충족 요건을 분석한 뒤 추가 자료를 정리합니다." },
          { q: "불허 처분을 받았습니다.", a: "불복 가능 범위 (행정심판 등)를 검토해 함께 진행합니다." },
          { q: "신청과 동시에 영업이 가능한가요?", a: "원칙적으로 허가 후 영업입니다. 사안별로 사전 신고 / 임시 영업 가능 여부를 확인합니다." }
        ]
      }}
    />
    </>
  );
}
