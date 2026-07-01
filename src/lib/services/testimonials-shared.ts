/**
 * 후기(Testimonial) 클라이언트-세이프 공유 타입/상수.
 * prisma 의존이 없어 client component에서도 안전하게 import 가능.
 */

export type PublicTestimonial = {
  quote: string;
  author: string;
  context: string;
  category: string;
  /** 정량화된 결과 (예: "D-8 비자 승인") — 있으면 뱃지로 표시 */
  outcome?: string;
  /** 진행 기간 (예: "약 3주") — 있으면 표시 */
  timeline?: string;
  /** 별점 1~5 — 있으면 별 아이콘으로 표시 */
  rating?: number;
};

export const TESTIMONIAL_CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가",
  CORP_FORMATION: "법인 설립"
};
