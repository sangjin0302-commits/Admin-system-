import { prisma } from "@/lib/prisma/client";

/**
 * 신뢰 뱃지 벨트 — 홈페이지에 노출되는 기관/언론 로고 스트립.
 *
 * SiteSetting.key = `trust.badges` (JSON array). 관리자 UI에서 편집.
 * 값이 없으면 하드코딩된 기본 뱃지가 표시됩니다.
 */

export interface TrustBadge {
  label: string;
  iconUrl?: string;
  url?: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
  { label: "행정사회" },
  { label: "한국행정사협회" },
  { label: "대한변호사협회 협업" },
  { label: "언론 소개 ①" },
  { label: "언론 소개 ②" },
  { label: "언론 소개 ③" },
];

function isTrustBadge(v: unknown): v is TrustBadge {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.label === "string" && o.label.length > 0;
}

export async function loadTrustBadges(): Promise<TrustBadge[]> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "trust.badges" },
    });
    if (!row || !row.value) return DEFAULT_BADGES;
    const parsed: unknown = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return DEFAULT_BADGES;
    const filtered = parsed.filter(isTrustBadge).map((b) => ({
      label: b.label,
      iconUrl: typeof b.iconUrl === "string" && b.iconUrl ? b.iconUrl : undefined,
      url: typeof b.url === "string" && b.url ? b.url : undefined,
    }));
    return filtered.length > 0 ? filtered : DEFAULT_BADGES;
  } catch {
    return DEFAULT_BADGES;
  }
}

export async function TrustBelt() {
  const badges = await loadTrustBadges();

  return (
    <section
      className="border-y border-line bg-surface-muted py-10"
      aria-labelledby="trust-belt-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="ethos-eyebrow text-center">TRUSTED BY</p>
        <h2
          id="trust-belt-heading"
          className="mt-2 text-center text-sm font-semibold tracking-wide text-text-muted"
        >
          언론에 소개된 ETHOS
        </h2>

        <div className="mt-6 overflow-x-auto">
          <ul
            className="flex min-w-max items-center justify-center gap-8 px-2"
            role="list"
          >
            {badges.map((badge, i) => (
              <li key={`${badge.label}-${i}`} className="shrink-0">
                <BadgeItem badge={badge} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function BadgeItem({ badge }: { badge: TrustBadge }) {
  const inner = badge.iconUrl ? (
    // 이미지 뱃지 (grayscale → hover:color)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={badge.iconUrl}
      alt={badge.label}
      className="h-10 w-auto max-w-[140px] object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
    />
  ) : (
    // 텍스트 뱃지
    <span className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-xs font-semibold uppercase tracking-wider text-text-muted opacity-80 transition hover:text-primary hover:opacity-100">
      {badge.label}
    </span>
  );

  if (badge.url) {
    return (
      <a
        href={badge.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={badge.label}
        className="inline-block"
      >
        {inner}
      </a>
    );
  }
  return inner;
}
