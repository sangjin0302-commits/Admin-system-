"use client";

import { useState } from "react";

type SyncResult = {
  ok: boolean;
  imported?: number;
  skipped?: number;
  translated?: number;
  updated?: number;
  counts?: Record<string, number>;
  titlesFixed?: number;
  duplicatesRemoved?: number;
  scanned?: number;
  remaining?: number;
  errors?: string[];
};

export function ImportControls() {
  const [loading, setLoading] = useState<"rss" | "bulk" | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 문자열로 보관해 자유롭게 편집(지우기/줄이기) 가능. 사용 시 숫자로 파싱.
  const [maxInput, setMaxInput] = useState("30");
  const max = Math.min(300, Math.max(1, Number.parseInt(maxInput, 10) || 30));
  const [translate, setTranslate] = useState(false);
  const [naverCategoryNo, setNaverCategoryNo] = useState("");
  const [targetCategory, setTargetCategory] = useState("");

  async function run(endpoint: string, mode: "rss" | "bulk") {
    setLoading(mode);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "요청 실패" }));
        throw new Error(err.error ?? "요청 실패");
      }
      setResult((await res.json()) as SyncResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* RSS 동기화 (최신 10편) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run("/api/admin/blog-import", "rss")}
          disabled={loading !== null}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-60"
        >
          {loading === "rss" ? "동기화 중..." : "RSS 동기화 (최신 10편)"}
        </button>
        <span className="text-xs text-text-muted">매시 자동 실행 + 영문 번역</span>
      </div>

      {/* 대량 import */}
      <div className="rounded-lg border border-gold/30 bg-gold-soft/10 p-4">
        <p className="font-serif text-sm font-bold text-primary">대량 가져오기 (PostTitleListAsync)</p>
        <p className="mt-1 text-xs text-text-muted">RSS 한계(~10편)를 넘어 페이징으로 최대 N편 가져옵니다. 중복은 자동 스킵. ⚠️ 서버 60초 제한 — 번역 켜면 20~30편, 끄면 50편 이하 권장. 많으면 나눠서 여러 번(중복 스킵됨).</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-primary">
            최대 글수:
            <input
              type="number"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              min={1}
              max={300}
              className="ml-2 w-20 rounded border border-line bg-surface px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-primary">
            <input
              type="checkbox"
              checked={translate}
              onChange={(e) => setTranslate(e.target.checked)}
            />
            영문 번역 (Anthropic 비용 발생)
          </label>
          <button
            type="button"
            onClick={() => run(`/api/admin/blog-bulk-import?max=${max}&translate=${translate ? 1 : 0}`, "bulk")}
            disabled={loading !== null}
            className="rounded-lg bg-gold-deep px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading === "bulk" ? `가져오는 중... (최대 ${max}편)` : `대량 가져오기 시작`}
          </button>
        </div>
      </div>

      {/* 게시판별 수입 — 네이버 실게시판 → 사이트 카테고리 지정 */}
      <div className="rounded-lg border border-gold/30 bg-gold-soft/10 p-4">
        <p className="font-serif text-sm font-bold text-primary">게시판별 가져오기 (네이버 카테고리 → 사이트 카테고리)</p>
        <p className="mt-1 text-xs text-text-muted">
          네이버 특정 게시판만 골라 수입하고, 사이트 카테고리를 강제 지정합니다. 네이버 게시판 번호(categoryNo)는
          해당 게시판 URL 의 <code>categoryNo=</code> 값. 비우면 전체·자동분류.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-primary">
            네이버 게시판 번호:
            <input
              type="text"
              value={naverCategoryNo}
              onChange={(e) => setNaverCategoryNo(e.target.value.trim())}
              placeholder="예: 7"
              className="ml-2 w-24 rounded border border-line bg-surface px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-primary">
            사이트 카테고리:
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="ml-2 rounded border border-line bg-surface px-2 py-1 text-sm"
            >
              <option value="">자동분류</option>
              <option value="visa">비자·체류</option>
              <option value="appeal">행정심판</option>
              <option value="contract">계약·사실조사</option>
              <option value="license">인허가</option>
              <option value="corporate">법인설립</option>
              <option value="other">기타</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({ max: String(max), translate: translate ? "1" : "0" });
              if (naverCategoryNo) params.set("categoryNo", naverCategoryNo);
              if (targetCategory) params.set("category", targetCategory);
              return run(`/api/admin/blog-bulk-import?${params.toString()}`, "bulk");
            }}
            disabled={loading !== null}
            className="rounded-lg bg-gold-deep px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading === "bulk" ? "가져오는 중..." : "게시판별 가져오기"}
          </button>
        </div>
      </div>

      {/* 데이터 정리 — 제목 인코딩·중복 교정 */}
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
        <p className="font-serif text-sm font-bold text-primary">데이터 정리 (제목 `+`/`%` 디코드 · 중복 제거)</p>
        <p className="mt-1 text-xs text-text-muted">
          제목에 `+`나 `%5B` 가 남은 글을 정상 제목으로 고치고, 같은 네이버 글(logNo)이 중복 저장된 경우 최신 1건만 남깁니다.
          재수입 없이 기존 데이터를 즉시 교정합니다.
        </p>
        <button
          type="button"
          onClick={() => run("/api/admin/blog-cleanup", "bulk")}
          disabled={loading !== null}
          className="mt-3 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {loading === "bulk" ? "정리 중..." : "제목·중복 정리 실행"}
        </button>
      </div>

      {/* 본문 전문 백필 — 요약만 저장된 기존 글 원문 재수집 */}
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
        <p className="font-serif text-sm font-bold text-primary">본문 전문 백필 (요약만 저장된 기존 글 복구)</p>
        <p className="mt-1 text-xs text-text-muted">
          네이버 RSS 는 요약만 줘서 과거 수입글 본문이 잘려 있습니다. 원문 페이지에서 전문을 다시 가져와 채웁니다.
          재수입은 중복(logNo)으로 스킵되므로 이 도구로만 고쳐집니다. ⚠️ 서버 60초 제한 — 1회 8편씩. 남으면 여러 번 실행.
        </p>
        <button
          type="button"
          onClick={() => run("/api/admin/blog-backfill-body?max=8", "bulk")}
          disabled={loading !== null}
          className="mt-3 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {loading === "bulk" ? "복구 중..." : "전문 백필 실행 (8편)"}
        </button>
      </div>

      {/* 블로그 메타 description batch (Anthropic) */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="font-serif text-sm font-bold text-primary">메타 description batch (Anthropic Haiku)</p>
        <p className="mt-1 text-xs text-text-muted">
          짧거나 빈 excerpt 글의 SEO/SNS description 자동 생성. ANTHROPIC_API_KEY 필요. 50편 ~$0.5.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run("/api/admin/blog-meta-batch?max=30&onlyMissing=1", "bulk")}
            disabled={loading !== null}
            className="rounded-lg bg-gold-deep px-4 py-2 text-xs font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading === "bulk" ? "생성 중..." : "30편 메타 생성 (누락만)"}
          </button>
          <button
            type="button"
            onClick={() => run("/api/admin/blog-meta-batch?max=50&onlyMissing=0", "bulk")}
            disabled={loading !== null}
            className="rounded-lg border border-gold/40 bg-surface px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-60"
          >
            50편 전체 재생성
          </button>
        </div>
      </div>

      {/* 카테고리 자동 분류 backfill */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="font-serif text-sm font-bold text-primary">카테고리 자동 분류 (backfill)</p>
        <p className="mt-1 text-xs text-text-muted">기존 글 중 미분류(naver)된 항목을 비자/심판/계약/인허가/법인설립/기타로 재분류합니다.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => run("/api/admin/blog-categorize?onlyNaver=1", "bulk")}
            disabled={loading !== null}
            className="rounded-lg border border-gold/40 bg-surface px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-60"
          >
            미분류 글 재분류
          </button>
          <button
            type="button"
            onClick={() => run("/api/admin/blog-categorize?force=1", "bulk")}
            disabled={loading !== null}
            className="rounded-lg border border-gold/40 bg-surface px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-60"
          >
            전체 강제 재분류
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-line bg-surface-muted/40 p-3 text-xs text-text">
          {result.imported !== undefined && (
            <p>가져옴: <strong>{result.imported}</strong> · 건너뜀: <strong>{result.skipped}</strong> · 번역됨: <strong>{result.translated}</strong></p>
          )}
          {result.updated !== undefined && result.counts !== undefined && (
            <p>분류됨: <strong>{result.updated}</strong>건 — {Object.entries(result.counts).map(([k, v]) => `${k}:${v}`).join(" · ")}</p>
          )}
          {(result.titlesFixed !== undefined || result.duplicatesRemoved !== undefined) && (
            <p>제목 교정: <strong>{result.titlesFixed ?? 0}</strong>건 · 중복 제거: <strong>{result.duplicatesRemoved ?? 0}</strong>건</p>
          )}
          {result.scanned !== undefined && result.imported === undefined && (
            <p>전문 복구: <strong>{result.updated ?? 0}</strong>건 (검사 {result.scanned}건) · 남은 대상: <strong>{result.remaining ?? 0}</strong>건</p>
          )}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-xs text-danger">{error}</div>
      )}
    </div>
  );
}
