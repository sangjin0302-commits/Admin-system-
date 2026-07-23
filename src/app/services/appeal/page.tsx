import type { Metadata } from "next";

import { ServicePage } from "@/components/public/service-page";
import { getSiteSetting } from "@/lib/services/site-settings";
import { LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "행정심판 — 에토스 행정사사무소(ETHOS)",
  description: "처분 통지부터 청구·심리·재결까지 행정심판 절차를 함께 준비합니다."
};

export default async function AppealPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const descOverride = await getSiteSetting("services.appeal.desc");
  return (
    <>
      <LegalServiceJsonLd
        serviceName="행정심판"
        description="처분 통지부터 청구·심리·재결까지 행정심판 절차"
        url="/services/appeal"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "업무분야", url: "/services" },
          { name: "행정심판", url: "/services/appeal" },
        ]}
      />
    <ServicePage
      lang={lang}
      serviceKey="appeal"
      descriptionOverride={descOverride}
      data={{
        kicker: "Administrative Appeal",
        title: "행정심판",
        tagline: "처분의 결과가 끝이 아닙니다",
        description:
          "처분 내용, 통지일, 청구기한을 확인하고 청구이유서와 증거자료를 정리해 심판을 준비합니다. 처분청·재결청 구조와 재결 후 절차까지 함께 검토합니다.",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 3v18M6 8h12M5 13l7-3 7 3M5 13v3a7 7 0 0 0 14 0v-3" />
          </svg>
        ),
        whoFor: [
          "행정기관의 처분을 받고 불복하려는 분",
          "이의신청 / 진정 절차가 필요한 분",
          "행정소송 전 행정심판을 검토하는 분",
          "처분 통지를 받았지만 청구기한이 걱정인 분",
          "보완 요청 / 청문 절차 진행 중인 분"
        ],
        process: [
          { step: "01", title: "처분 검토", desc: "처분서 내용, 통지일, 송달일, 청구기한 확인" },
          { step: "02", title: "청구 이유 정리", desc: "사실관계, 법적 근거, 위법·부당 사유 정리" },
          { step: "03", title: "증거자료 준비", desc: "증명·소명에 필요한 자료 정리" },
          { step: "04", title: "심판 진행", desc: "청구 → 심리 → 재결까지 단계별 추적" }
        ],
        documents: [
          "처분서 / 통지서 원본 또는 사본",
          "처분의 근거가 된 자료 (조사보고서 등)",
          "반박 또는 소명 자료",
          "관련 계약서, 사실관계 증빙",
          "이전 처분 / 행정 절차 기록"
        ],
        deadlines: [
          { label: "행정심판 청구기한", value: "처분을 안 날부터 90일, 처분이 있은 날부터 180일" },
          { label: "이의신청 기한", value: "법령마다 다름 (일반적으로 30~90일)" },
          { label: "심리 후 재결", value: "청구 후 약 60일 (연장 가능)" }
        ],
        faq: [
          { q: "행정심판과 행정소송의 차이는?", a: "행정심판은 행정기관 내 불복, 행정소송은 법원의 판단입니다. 사안에 따라 선택·연계가 다릅니다." },
          { q: "청구기한이 지났습니다.", a: "원칙적으로 청구 불가하나, 정당한 사유가 있는 경우 예외가 있을 수 있어 사실관계를 먼저 확인합니다." },
          { q: "변호사가 아닌 행정사가 진행 가능한가요?", a: "행정심판 청구 단계의 서류 작성·정리는 행정사 업무 범위 내입니다. 사안에 따라 변호사 협업이 필요할 수 있습니다." },
          { q: "재결 후 다시 다툴 수 있나요?", a: "재결에 불복하는 경우 행정소송으로 진행할 수 있습니다. 별도 기한 검토가 필요합니다." }
        ]
      }}
    />
    </>
  );
}
