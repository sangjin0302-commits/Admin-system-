/**
 * 탭 프리로드 서비스 (클라이언트 전용).
 *
 * 관리자 목록 페이지에서 사건/문의 행에 마우스가 올라오면
 * 상세 데이터를 미리 fetch 하여 캐시에 저장.
 * 실제 상세 페이지 진입 시 즉시 표시.
 *
 * - 캐시: 최대 20건 LRU
 * - TTL: 30초 (신선도)
 * - Feature flag: `tab_preload` (client-side check via hook)
 */

const CAPACITY = 20;
const TTL_MS = 30_000;

type Entry = {
  at: number;
  data: unknown;
  key: string;
};

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

function evictIfNeeded() {
  while (cache.size > CAPACITY) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

export function getPreloaded<T = unknown>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  // touch (LRU): re-insert
  cache.delete(key);
  cache.set(key, e);
  return e.data as T;
}

export async function preload<T = unknown>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = getPreloaded<T>(key);
  if (existing !== null) return existing;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const p = fetcher()
    .then((data) => {
      cache.set(key, { at: Date.now(), data, key });
      evictIfNeeded();
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p as Promise<unknown>);
  return p;
}

export function invalidatePreload(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export function preloadCaseDetail(caseId: string): Promise<unknown> {
  return preload(`case:${caseId}`, async () => {
    const res = await fetch(`/api/admin/case-matters/${caseId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`preload case ${caseId} status ${res.status}`);
    return res.json();
  });
}

export function preloadInquiryDetail(inquiryId: string): Promise<unknown> {
  return preload(`inquiry:${inquiryId}`, async () => {
    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`preload inquiry ${inquiryId} status ${res.status}`);
    return res.json();
  });
}
