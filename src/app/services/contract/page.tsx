import type { Metadata } from "next";

import { ServicePage } from "@/components/public/service-page";
import { getSiteSetting } from "@/lib/services/site-settings";
import { LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "계약서 / 사실조사 — 에토스 행정사사무소(ETHOS)",
  description: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성을 지원합니다."
};

export default async function ContractPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const [descOverride, titleOverride, taglineOverride, whoForOverride, documentsOverride, faqOverride] = await Promise.all([
    getSiteSetting("services.contract.desc"),
    getSiteSetting("services.contract.title"),
    getSiteSetting("services.contract.tagline"),
    getSiteSetting("services.contract.whoFor"),
    getSiteSetting("services.contract.documents"),
    getSiteSetting("services.contract.faq"),
  ]);
  return (
    <>
      <LegalServiceJsonLd
        serviceName="계약서 / 사실조사"
        description="계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성"
        url="/services/contract"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "업무분야", url: "/services" },
          { name: "계약·사실조사", url: "/services/contract" },
        ]}
      />
    <ServicePage
      lang={lang}
      serviceKey="contract"
      descriptionOverride={descOverride}
      titleOverride={titleOverride}
      taglineOverride={taglineOverride}
      whoForOverride={whoForOverride}
      documentsOverride={documentsOverride}
      faqOverride={faqOverride}
      data={{
        kicker: "Contract & Investigation",
        title: "계약서 / 사실조사",
        tagline: "분쟁의 시작을 미리 정리합니다",
        description:
          "계약 체결 전 검토, 분쟁 발생 후 사실관계 조사, 법적 근거 정리, 조사보고서 작성까지 지원합니다. 행정사가 다룰 수 있는 범위 내에서 함께 합니다.",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.4">
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6M8 13h8M8 17h5" />
          </svg>
        ),
        whoFor: [
          "계약 체결 전 내용 검토가 필요한 분",
          "기존 계약 분쟁의 사실관계를 정리해야 하는 분",
          "사실조사 보고서가 필요한 분",
          "용역 / 임대차 / 동업 계약을 작성하시는 분",
          "민원 / 행정 절차에 사실관계 증빙이 필요한 분"
        ],
        process: [
          { step: "01", title: "사안 청취", desc: "계약 / 분쟁 배경, 의뢰인의 의도 확인" },
          { step: "02", title: "범위 설정", desc: "조사 / 작성 범위 협의" },
          { step: "03", title: "자료 수집·분석", desc: "관련 문서, 통신 기록, 증빙 정리" },
          { step: "04", title: "보고서 / 계약서 작성", desc: "검토 결과 정리 및 납부" }
        ],
        documents: [
          "기존 계약서 / 합의서 / 견적서",
          "분쟁 관련 문자·이메일 기록",
          "사실관계 증빙 (사진, 영수증, 계좌 이체 내역 등)",
          "관련 인허가 / 등록 자료",
          "상대방 인적사항 (가능한 범위)"
        ],
        deadlines: [
          { label: "계약서 작성", value: "사안 청취 후 평균 1~2주" },
          { label: "사실조사 보고서", value: "범위에 따라 2주 ~ 2개월" },
          { label: "긴급 검토", value: "상담 시 별도 협의" }
        ],
        faq: [
          { q: "변호사 업무와 어떻게 다른가요?", a: "행정사는 행정 절차와 사실관계 정리 중심입니다. 소송 대리는 변호사 업무이며, 사안에 따라 협업할 수 있습니다." },
          { q: "조사 보고서는 어디에 쓰이나요?", a: "행정 절차, 보험 청구, 분쟁 사전 정리, 협의 자료 등에 활용됩니다." },
          { q: "계약서만 검토받을 수 있나요?", a: "가능합니다. 검토 후 수정 사항을 정리해 드립니다." },
          { q: "비밀유지가 가능한가요?", a: "수임 자료는 분리 보관하며, 외부 자동 전송 없이 사무소 내부에서만 다룹니다." }
        ]
      }}
    />
    </>
  );
}
