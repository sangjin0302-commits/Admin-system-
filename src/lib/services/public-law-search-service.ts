/**
 * 고객용 법령·판례·해석례 참고 검색 (B안).
 *
 * ⚠️ 이 파일은 고객(비로그인 일반인)에게 노출되는 유일한 법률 검색 경로다.
 *    admin 코파일럿(law-api-service의 18개 target, 별표 다운로드, AI 요약 등)과
 *    의도적으로 분리되어 있으며, 아래 제약은 확장하지 않는다.
 *
 * 고정 제약 (변경 금지):
 *  1. AI 처리 없음 — smart-ai-client / model-router 등 AI 모듈 import 금지
 *  2. 3개 target만 사용 — law(법령) / prec(판례) / expc(법령해석례)
 *     행정심판재결례·자치법규·부처유권해석·별표서식·조약·위원회결정례는 admin 전용
 *  3. 결과 수 상한 — PUBLIC_LIMITS (법령 3 / 판례 3 / 해석례 2)
 *  4. 본문·요지 미노출 — 아래 화이트리스트 필드만 반환. LawResultItem을 그대로
 *     반환하거나 extra 객체를 통째로 넘기지 말 것 (원본 필드가 전부 새어나감)
 *  5. 파일 다운로드 링크(hwpUrl/pdfUrl)·상세링크(detailUrl) 미노출
 *  6. 상세 조회(getDetail) 호출 금지 — 본문/요지가 딸려온다
 *
 * 반환 타입은 명시적 화이트리스트다. law-api-service에 새 필드가 생겨도
 * 여기서 매핑하지 않는 한 고객에게 자동 노출되지 않는다.
 *
 * 확장 요청이 오면 여기 추가하지 말고 admin 경로(/admin/law-research)에 추가할 것.
 */

import {
  searchLaw,
  searchPrecedent,
  searchInterpretation
} from "@/lib/services/law-api-service";

/** 고객 노출 결과 수 상한 — 확장 금지 */
export const PUBLIC_LIMITS = {
  laws: 3,
  precedents: 3,
  interpretations: 2
} as const;

export type PublicLawResult = {
  lawId: string;
  name: string;
  lawType: string;
  effectiveDate: string;
};

export type PublicPrecedentResult = {
  caseName: string;
  courtName: string;
  caseNumber: string;
  judgmentDate: string;
};

export type PublicInterpretationResult = {
  title: string;
  agency: string;
  date: string;
};

export type PublicLawSearchData = {
  laws: PublicLawResult[];
  precedents: PublicPrecedentResult[];
  interpretations: PublicInterpretationResult[];
};

const EMPTY: PublicLawSearchData = {
  laws: [],
  precedents: [],
  interpretations: []
};

export async function publicLawSearch(
  keyword: string
): Promise<PublicLawSearchData> {
  const kw = keyword.trim();
  if (!kw) return EMPTY;

  // 상한보다 조금 더 받아서 빈 제목 등이 걸러진 뒤에도 상한을 채운다.
  const [lawsRaw, precsRaw, interpsRaw] = await Promise.all([
    searchLaw(kw, PUBLIC_LIMITS.laws + 2).catch(() => []),
    searchPrecedent(kw, PUBLIC_LIMITS.precedents + 2).catch(() => []),
    searchInterpretation(kw, PUBLIC_LIMITS.interpretations + 1).catch(() => [])
  ]);

  // 법령: 이름/구분/시행일만. 소관부처·상세링크 미노출.
  const laws: PublicLawResult[] = lawsRaw
    .slice(0, PUBLIC_LIMITS.laws)
    .map((l) => ({
      lawId: l.id,
      name: l.title,
      lawType: l.extra?.["법령구분명"] ?? "",
      effectiveDate: l.date
    }));

  // 판례: 제목/법원/사건번호/선고일자만.
  // 판시사항·판결요지는 검색 응답에 없고, 상세 호출도 이 경로에서 하지 않는다.
  const precedents: PublicPrecedentResult[] = precsRaw
    .slice(0, PUBLIC_LIMITS.precedents)
    .map((p) => ({
      caseName: p.title,
      courtName: p.agency,
      caseNumber: p.number,
      judgmentDate: p.date
    }));

  // 해석례: 제목/기관/일자만. 질의요지·회신내용 미노출.
  const interpretations: PublicInterpretationResult[] = interpsRaw
    .slice(0, PUBLIC_LIMITS.interpretations)
    .map((i) => ({
      title: i.title,
      agency: i.agency,
      date: i.date
    }));

  return { laws, precedents, interpretations };
}
