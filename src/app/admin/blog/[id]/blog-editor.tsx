"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { PUBLIC_CATEGORY_LABEL, type PublicCategory } from "@/lib/services/blog-categorizer";
import { parseCardNews, serializeCardNews, type CardNewsSlide } from "@/lib/services/card-news";

/** tags 는 DB에 JSON 문자열로 저장된다. 표시용 배열로 파싱(구형 콤마문자열도 흡수). */
function parseTags(raw: string): string[] {
  try {
    const a = JSON.parse(raw);
    if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string");
  } catch {
    /* JSON 아니면 콤마 분리로 폴백 */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

type PostData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  published: boolean;
  pinned: boolean;
  sortOrder: number;
  titleEn: string;
  excerptEn: string;
  bodyEn: string;
  cardNews: string;
  cardNewsEn: string;
  scheduledAt: string;
} | null;

/** datetime-local 입력값(로컬 시간) ↔ ISO 변환 헬퍼. */
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BlogEditor({ post }: { post: PostData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [category, setCategory] = useState(post?.category ?? "other");
  const [tags, setTags] = useState(post?.tags ?? "[]");
  // 쉼표로 편하게 입력 → 내부 tags(JSON)로 동기화.
  const [tagText, setTagText] = useState(parseTags(post?.tags ?? "[]").join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [pinned, setPinned] = useState(post?.pinned ?? false);
  const [sortOrder, setSortOrder] = useState(String(post?.sortOrder ?? 0));
  // 영문 직접 입력(AI 번역 대신 사람이 넣기). 값 있으면 EN 페이지가 이 값을 씀.
  const [titleEn, setTitleEn] = useState(post?.titleEn ?? "");
  const [excerptEn, setExcerptEn] = useState(post?.excerptEn ?? "");
  const [bodyEn, setBodyEn] = useState(post?.bodyEn ?? "");
  // 카드뉴스 슬라이드(첫 장 = 커버). KO/EN 각각.
  const [cardSlides, setCardSlides] = useState<CardNewsSlide[]>(() => parseCardNews(post?.cardNews ?? ""));
  const [cardSlidesEn, setCardSlidesEn] = useState<CardNewsSlide[]>(() => parseCardNews(post?.cardNewsEn ?? ""));
  // 예약 게시(datetime-local, 로컬시간). 값 있고 미발행이면 크론이 그 시각 자동 발행.
  const [scheduledAt, setScheduledAt] = useState(isoToLocalInput(post?.scheduledAt ?? ""));
  // 네이버 링크 → 본문 자동 가져오기(수입 시 스크레이프 실패한 글 복구용).
  const [naverLink, setNaverLink] = useState("");
  const [fetchingBody, setFetchingBody] = useState(false);

  // 카드뉴스 슬라이드 조작 헬퍼(KO/EN 공용).
  const updateSlide = (
    list: CardNewsSlide[],
    setList: (v: CardNewsSlide[]) => void,
    idx: number,
    patch: Partial<CardNewsSlide>,
  ) => {
    setList(list.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const addSlide = (list: CardNewsSlide[], setList: (v: CardNewsSlide[]) => void) =>
    setList([...list, {}]);
  const removeSlide = (list: CardNewsSlide[], setList: (v: CardNewsSlide[]) => void, idx: number) =>
    setList(list.filter((_, i) => i !== idx));
  const moveSlide = (
    list: CardNewsSlide[],
    setList: (v: CardNewsSlide[]) => void,
    idx: number,
    dir: -1 | 1,
  ) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[idx], next[j]] = [next[j], next[idx]];
    setList(next);
  };

  const handleFetchBody = async () => {
    if (!naverLink.trim()) {
      toast.error("네이버 블로그 링크를 입력해주세요.");
      return;
    }
    setFetchingBody(true);
    try {
      const res = await fetch("/api/admin/blog/refetch-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: naverLink.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.html) {
        toast.error(data.error ?? "본문을 가져오지 못했습니다.");
        return;
      }
      setBody(data.html);
      toast.success(`본문 ${data.length.toLocaleString()}자 가져옴 — 확인 후 저장하세요.`);
    } catch {
      toast.error("가져오기 중 오류가 발생했습니다.");
    } finally {
      setFetchingBody(false);
    }
  };

  const onTagTextChange = (v: string) => {
    setTagText(v);
    setTags(JSON.stringify(v.split(",").map((s) => s.trim()).filter(Boolean)));
  };

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("제목과 본문을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post?.id,
          title,
          slug: slug || autoSlug(title),
          excerpt,
          body,
          category,
          tags,
          published,
          pinned,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
          titleEn,
          excerptEn,
          bodyEn,
          cardNews: serializeCardNews(cardSlides),
          cardNewsEn: serializeCardNews(cardSlidesEn),
          // datetime-local(로컬) → ISO. 빈값이면 예약 해제.
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "저장 실패");
        return;
      }
      toast.success(post ? "수정 완료" : "작성 완료");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  // 카드뉴스 슬라이드 에디터(KO/EN 공용). 첫 장은 "커버(표지)"로 표시.
  const renderCardEditor = (
    list: CardNewsSlide[],
    setList: (v: CardNewsSlide[]) => void,
    label: string,
  ) => (
    <div className="mt-4 rounded-lg border border-dashed border-gold/40 bg-gold-soft/10 p-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-muted">{label} · 첫 장 = 커버(표지)</label>
        <button
          type="button"
          onClick={() => addSlide(list, setList)}
          className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          + 슬라이드 추가
        </button>
      </div>
      {list.length === 0 && (
        <p className="mt-2 text-[11px] text-text-muted">
          카드뉴스 없음. 추가하면 글 맨 끝에 카드로 렌더됩니다(첫 장은 커버).
        </p>
      )}
      <div className="mt-2 space-y-3">
        {list.map((s, i) => (
          <div key={i} className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${i === 0 ? "text-gold-deep" : "text-text-muted"}`}>
                {i === 0 ? "커버(표지)" : `카드 ${i + 1}`}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveSlide(list, setList, i, -1)} disabled={i === 0}
                  className="rounded border border-line px-1.5 text-xs disabled:opacity-30" aria-label="위로">↑</button>
                <button type="button" onClick={() => moveSlide(list, setList, i, 1)} disabled={i === list.length - 1}
                  className="rounded border border-line px-1.5 text-xs disabled:opacity-30" aria-label="아래로">↓</button>
                <button type="button" onClick={() => removeSlide(list, setList, i)}
                  className="rounded border border-danger/40 px-1.5 text-xs text-danger" aria-label="삭제">×</button>
              </div>
            </div>
            <input
              value={s.image ?? ""}
              onChange={(e) => updateSlide(list, setList, i, { image: e.target.value })}
              placeholder="이미지 URL (선택)"
              className="mt-2 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-xs"
            />
            <input
              value={s.title ?? ""}
              onChange={(e) => updateSlide(list, setList, i, { title: e.target.value })}
              placeholder="카드 제목 (선택)"
              className="mt-1.5 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-xs"
            />
            <textarea
              value={s.body ?? ""}
              onChange={(e) => updateSlide(list, setList, i, { body: e.target.value })}
              placeholder="카드 본문 (선택)"
              rows={2}
              className="mt-1.5 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-text-muted">제목</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!post) setSlug(autoSlug(e.target.value));
              }}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">슬러그</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            >
              {/* 공개 사이트가 쓰는 5대 분야 + 기타 (라벨은 공개 페이지와 동일하게 유지) */}
              {(Object.entries(PUBLIC_CATEGORY_LABEL) as [PublicCategory, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              {/* 현재 값이 위 6개에 없으면(구형 general/news 등) 잃지 않도록 노출 */}
              {!(category in PUBLIC_CATEGORY_LABEL) && <option value={category}>{category}</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">키워드/태그 (쉼표로 구분)</label>
            <input
              value={tagText}
              onChange={(e) => onTagTextChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
              placeholder="비자, 체류, D-2"
            />
            {parseTags(tags).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parseTags(tags).map((t) => (
                  <span key={t} className="rounded-full bg-gold-soft/40 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-text-muted">발췌</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
          />
        </div>

        {/* 네이버 링크로 본문 전문 가져오기 — 수입 시 스크레이프 실패해 요약만 저장된
            글을 복구. 실패 시 원문에서 직접 복사해 아래 본문에 붙여 넣으면 됨. */}
        <div className="mt-4 rounded-lg border border-dashed border-line bg-surface-muted/40 p-3">
          <label className="text-xs font-semibold text-text-muted">
            네이버 링크로 본문 가져오기 (선택)
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              value={naverLink}
              onChange={(e) => setNaverLink(e.target.value)}
              placeholder="https://blog.naver.com/아이디/글번호"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleFetchBody}
              disabled={fetchingBody}
              className="shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
            >
              {fetchingBody ? "가져오는 중…" : "본문 가져오기"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-text-muted">
            가져오면 아래 본문이 전문으로 채워집니다. 네이버 차단 등으로 실패하면 원문에서
            직접 복사해 붙여 넣으세요.
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-muted">본문 (Markdown)</label>
            <span className="text-[11px] text-text-muted">{body.length.toLocaleString()}자</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={24}
            className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-[11px] text-text-muted">길이 제한 없음(수만 자 가능).</p>
        </div>

        {/* 카드뉴스(국문) — 본문과 달리 글 맨 끝에만. 첫 장은 커버. */}
        {renderCardEditor(cardSlides, setCardSlides, "카드뉴스 (국문)")}

        {/* ── 영문 직접 입력 ─────────────────────────────
            값을 넣으면 EN 페이지(/blog/글?lang=en)가 AI 번역 대신 이 값을 씀. */}
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-bold text-primary">영문 (English) — 직접 입력</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            채우면 영문 페이지가 이 값을 사용합니다. 비우면 국문/자동번역 폴백.
          </p>
          <div className="mt-3">
            <label className="text-xs font-semibold text-text-muted">Title (EN)</label>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-text-muted">Excerpt (EN)</label>
            <textarea
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-muted">Body (EN, Markdown)</label>
              <span className="text-[11px] text-text-muted">{bodyEn.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={20}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
            />
          </div>
          {/* 카드뉴스(영문) */}
          {renderCardEditor(cardSlidesEn, setCardSlidesEn, "Card News (EN)")}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              <span className="text-text-strong">공개</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              <span className="text-text-strong">상단 고정(pin)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">정렬순서</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-20 rounded border border-line bg-surface-muted px-2 py-1 text-sm"
                title="작을수록 앞. 고정 글끼리·같은 값이면 최신순."
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">예약 게시</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded border border-line bg-surface-muted px-2 py-1 text-sm"
                title="시각 지정 + 공개 해제 상태로 저장하면 그 시각 이후 크론이 자동 공개."
              />
              {scheduledAt && (
                <button type="button" onClick={() => setScheduledAt("")}
                  className="text-[11px] text-text-muted underline">해제</button>
              )}
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-50"
          >
            {saving ? "저장 중..." : post ? "수정" : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}
