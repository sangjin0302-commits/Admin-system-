/** 블로그 게시판 카드 정렬 키(공개 페이지·테스트 공용). */
export type BoardSortable = { pinned: boolean; sortOrder: number; dateMs: number };

/**
 * 정렬 순서: 고정 글 먼저 → sortOrder 작을수록 앞 → 최신(dateMs 큰 것) 먼저.
 */
export function compareBoardCards(a: BoardSortable, b: BoardSortable): number {
  return Number(b.pinned) - Number(a.pinned) || a.sortOrder - b.sortOrder || b.dateMs - a.dateMs;
}
