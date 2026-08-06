/**
 * 관보 항목 → 블로그 "영향 안내" 칼럼 초안 스켈레톤(순수).
 *
 * ⚠️ 정책: 블로그 임의/AI 생성 금지(blog-source-guard). 이 모듈은 blogPost 를
 * 만들지 않는다 — 관리자가 직접 채워 발행하는 **작성 보조 골격**(사실은 원문
 * 확인 후 사람이 작성)만 생성한다. 저장·발행 없음.
 */

import type { GazetteItem } from "@/lib/services/gazette-client";
import { matchGazetteService } from "@/lib/services/gazette-service-match";

export type GazetteColumnDraft = { title: string; markdown: string };

function fmtDate(ms: number): string {
  return ms > 0 ? new Date(ms).toLocaleDateString("ko-KR") : "";
}

/** 관보 항목에서 칼럼 초안(제목 + 마크다운 골격) 생성. 값 없는 줄은 생략. */
export function buildGazetteColumnDraft(item: GazetteItem): GazetteColumnDraft {
  const title = `${item.title} — 내 사안에 미치는 영향`;
  const svc = matchGazetteService(item, "ko");
  const meta = [
    item.agency ? `발령기관: ${item.agency}` : "",
    item.category ? `구분: ${item.category}` : "",
    fmtDate(item.dateMs) ? `게시일: ${fmtDate(item.dateMs)}` : "",
    item.legalBasis && item.legalBasis.trim() ? `근거 법령: ${item.legalBasis.trim()}` : "",
  ].filter(Boolean);
  const safeUrl = item.url && /^https?:\/\//i.test(item.url) ? item.url : null;

  const lines: string[] = [
    `# ${title}`,
    "",
    ...(meta.length ? [`> ${meta.join(" · ")}`] : []),
    ...(safeUrl ? [`> 원문: ${safeUrl}`] : []),
    "",
    "## 무엇이 바뀌었나",
    // 관보 요약이 있으면 자동 인용해 초안 시작점 제공(사람이 원문 확인 후 보완).
    item.summary && item.summary.trim()
      ? `${item.summary.trim()}\n\n(위는 관보 요약 자동 인용 — 원문 확인 후 사실 검증·보완)`
      : "(관보 원문의 핵심 변경 내용을 1~2문단으로 정리 — 원문 확인 후 사실대로 작성)",
    "",
    "## 누구에게 영향이 있나",
    "(대상·요건을 정리)",
    "",
    "## 지금 확인할 것",
    "- ",
    "- ",
    "",
    "## 도움이 필요하면",
    svc
      ? `${svc.label} 관련 사안은 [무료 상담 신청](/intake)으로 확인해 드립니다.`
      : "관련 사안은 [무료 상담 신청](/intake)으로 확인해 드립니다.",
  ];

  return { title, markdown: lines.join("\n") };
}
