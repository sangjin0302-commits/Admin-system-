/**
 * 블로그 카테고리별 CTA 메시지 매핑
 *
 * 카테고리에 따라 맞춤 CTA 문구를 반환합니다.
 */

export type BlogCtaData = {
  title: string;
  description: string;
  href: string;
};

const CTA_MAP: Record<string, BlogCtaData> = {
  visa: {
    title: "비자 문제, 검토부터 시작하세요",
    description:
      "체류자격 변경, 비자 연장, 초청 등 전문 행정사가 서류를 검토하고 맞춤 안내를 드립니다.",
    href: "/intake?cat=visa&from=blog-cta",
  },
  appeal: {
    title: "행정심판, 전문 행정사가 도와드립니다",
    description:
      "행정처분에 대한 불복 절차, 기한 계산, 증거 정리까지 체계적으로 진행합니다.",
    href: "/intake?cat=appeal&from=blog-cta",
  },
  license: {
    title: "사업 인허가, 절차를 대신합니다",
    description:
      "업종별 인허가 요건 확인부터 신청서 작성, 관공서 제출까지 원스톱으로 처리합니다.",
    href: "/intake?cat=license&from=blog-cta",
  },
  corporate: {
    title: "법인설립, 빠르고 정확하게",
    description:
      "법인설립 등기, 사업자등록, 인허가까지 한 번에 진행합니다.",
    href: "/intake?cat=corporate&from=blog-cta",
  },
  contract: {
    title: "계약·사실조사, 꼼꼼히 확인합니다",
    description:
      "계약서 검토, 사실확인서 작성, 내용증명 등 실무를 대행합니다.",
    href: "/intake?cat=contract&from=blog-cta",
  },
};

const DEFAULT_CTA: BlogCtaData = {
  title: "무료 검토 신청",
  description:
    "사안을 간략히 알려주시면, 행정사가 검토 후 진행 가능 여부와 예상 비용을 안내드립니다.",
  href: "/intake?from=blog-cta",
};

/**
 * 블로그 카테고리에 맞는 CTA 데이터를 반환합니다.
 */
export function getCtaForCategory(category: string): BlogCtaData {
  return CTA_MAP[category] ?? DEFAULT_CTA;
}
