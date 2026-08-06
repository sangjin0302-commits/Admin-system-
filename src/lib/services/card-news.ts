/**
 * 카드뉴스 모델 — 블로그 글 맨 끝에만 붙는 슬라이드 묶음.
 *
 * 저장: BlogPost.cardNews / cardNewsEn 에 JSON 배열 문자열.
 * 규칙: **첫 슬라이드는 항상 커버(표지)**. 나머지는 본문 카드.
 */

export type CardNewsSlide = {
  image?: string; // 이미지 URL(선택)
  title?: string; // 카드 제목(선택)
  body?: string; // 카드 본문(선택)
};

/** JSON 문자열/배열을 안전하게 슬라이드 배열로 파싱. 깨진 값은 빈 배열. */
export function parseCardNews(raw: unknown): CardNewsSlide[] {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      arr = JSON.parse(s);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: CardNewsSlide[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const slide: CardNewsSlide = {};
    if (typeof o.image === "string" && o.image.trim()) slide.image = o.image.trim();
    if (typeof o.title === "string" && o.title.trim()) slide.title = o.title.trim();
    if (typeof o.body === "string" && o.body.trim()) slide.body = o.body.trim();
    if (slide.image || slide.title || slide.body) out.push(slide);
  }
  return out;
}

/** 저장용 직렬화. 빈 배열이면 null(컬럼 비움). */
export function serializeCardNews(slides: CardNewsSlide[]): string | null {
  const clean = slides
    .map((s) => ({
      image: s.image?.trim() || undefined,
      title: s.title?.trim() || undefined,
      body: s.body?.trim() || undefined,
    }))
    .filter((s) => s.image || s.title || s.body);
  return clean.length > 0 ? JSON.stringify(clean) : null;
}

/** 첫 슬라이드는 커버로 취급. { cover, rest } 로 분리. */
export function splitCardNews(slides: CardNewsSlide[]): {
  cover: CardNewsSlide | null;
  rest: CardNewsSlide[];
} {
  if (slides.length === 0) return { cover: null, rest: [] };
  return { cover: slides[0], rest: slides.slice(1) };
}
