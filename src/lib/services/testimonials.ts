/**
 * 후기(Testimonial) 통합 조회.
 * DB(Testimonial, 관리자 편집) + 기본 샘플 병합.
 */

import { prisma } from "@/lib/prisma/client";
import {
  TESTIMONIAL_CATEGORY_LABELS,
  type PublicTestimonial
} from "@/lib/services/testimonials-shared";

export {
  TESTIMONIAL_CATEGORY_LABELS,
  type PublicTestimonial
} from "@/lib/services/testimonials-shared";

const DEFAULT_TESTIMONIALS: readonly PublicTestimonial[] = [
  {
    quote:
      "처분서를 받고 막막했는데, 처음 상담 때부터 청구기한과 다음 단계를 정확히 짚어주셔서 마음이 놓였습니다.",
    author: "박○○",
    context: "영업정지 처분 행정심판",
    category: "ADMIN_APPEAL",
    outcome: "청구기한 내 접수",
    timeline: "약 2주 준비"
  },
  {
    quote:
      "체류 자격 변경 자료가 복잡했는데, 점수제 항목별로 무엇이 부족한지 명확히 안내해주셔서 차근차근 준비할 수 있었습니다.",
    author: "Mr. T",
    context: "F-2 자격 변경",
    category: "VISA_STAY",
    outcome: "체류자격 변경 진행",
    timeline: "약 3주"
  },
  {
    quote:
      "분쟁 사실관계가 너무 얽혀 있었는데, 시점별로 정리해주신 보고서가 이후 협의에 결정적이었습니다.",
    author: "김○○",
    context: "용역계약 사실조사",
    category: "CONTRACT_INVESTIGATION"
  },
  {
    quote:
      "보완 요청을 받고 당황했지만 어떤 자료를 어떻게 보완하면 되는지 단계별로 알려주셔서 빠르게 대응할 수 있었습니다.",
    author: "이○○",
    context: "음식점 영업허가",
    category: "LICENSE_PERMIT"
  }
];

export async function listPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { quote: true, author: true, context: true, category: true },
      take: 12, // 홈 노출 상한 — 무제한 findMany 방지
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        quote: r.quote,
        author: r.author,
        context: r.context,
        category: r.category
      }));
    }
  } catch {
    // table missing / db down → defaults
  }
  return [...DEFAULT_TESTIMONIALS];
}

export async function listAdminTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
}
