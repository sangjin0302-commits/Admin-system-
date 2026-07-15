/**
 * 고객용 법령·판례·해석례 참고 검색 (B안).
 *
 * 엄격 제약:
 *  - AI 처리 절대 없음 (백엔드에서 원천 차단)
 *  - 판례 summary(판시사항/판결요지) 필드 완전 제거 — 제목만
 *  - 해석례 summary 필드 완전 제거 — 제목만
 *  - 결과 수: 법령 3 / 판례 3 / 해석례 2
 */

import {
  searchLaw,
  searchPrecedent,
  searchInterpretation
} from "@/lib/services/law-api-service";

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

export async function publicLawSearch(keyword: string): Promise<PublicLawSearchData> {
  const kw = keyword.trim();
  if (!kw) return { laws: [], precedents: [], interpretations: [] };

  const [lawsRaw, precsRaw, interpsRaw] = await Promise.all([
    searchLaw(kw, 5),
    searchPrecedent(kw, 5),
    searchInterpretation(kw, 3)
  ]);

  const laws: PublicLawResult[] = lawsRaw.slice(0, 3).map((l) => ({
    lawId: l.lawId,
    name: l.name,
    lawType: l.lawType,
    effectiveDate: l.effectiveDate
  }));

  // 판례: summary(판시사항/판결요지) 필드 완전 제거 — 제목/법원/사건번호/선고일자만
  const precedents: PublicPrecedentResult[] = precsRaw.slice(0, 3).map((p) => ({
    caseName: p.caseName,
    courtName: p.courtName,
    caseNumber: p.caseNumber,
    judgmentDate: p.judgmentDate
  }));

  // 해석례: summary(질의요지) 완전 제거 — 제목/기관/일자만
  const interpretations: PublicInterpretationResult[] = interpsRaw.slice(0, 2).map((i) => ({
    title: i.title,
    agency: i.agency,
    date: i.date
  }));

  return { laws, precedents, interpretations };
}
