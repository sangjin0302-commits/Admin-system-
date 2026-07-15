import type { Metadata } from "next";

import { PublicLawLookup } from "@/components/public/public-law-lookup";

export const metadata: Metadata = {
  title: "법령·판례 참고 검색 - ETHOS 행정사무소",
  description:
    "국가법령정보센터 자료를 활용한 법령·판례·해석례 참고 검색. 참고용 자료이며 법률 자문이 아닙니다."
};

export default function LawLookupPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-14 sm:px-6 sm:py-20">
        <section className="text-center">
          <p className="ethos-eyebrow">Reference Lookup</p>
          <h1 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">법령·판례 참고 검색</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            국가법령정보센터(법제처) 공식 자료의 제목만 안내합니다. 상세 검토는 상담을 통해 진행됩니다.
          </p>
        </section>
        <PublicLawLookup />
      </div>
    </div>
  );
}
