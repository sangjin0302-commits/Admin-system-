type Props = {
  size?: number;
  className?: string;
};

/**
 * ETHOS 브랜드 엠블럼 (v2 — 고급 에디토리얼 리디자인)
 *
 * 디자인 원칙 (logo-generator-skill 의 geometric/editorial 철학 적용):
 * - 더블 링(인장형 엠블럼): 외곽 네이비 + 내부 골드 헤어라인
 * - Logos(이성): 정제된 이오니아 기둥 (볼류트 + 플루팅)
 * - Ethos(방향/신뢰): 8각 컴퍼스 별
 * - Pathos(공감): 기둥을 받치는 아치
 * - dot-matrix 악센트로 기하학적 정밀감
 */
export function EthosLogo({ size = 64, className }: Props) {
  const NAVY = "rgb(26 60 95)";
  const GOLD = "rgb(201 169 97)";
  const GOLD_DEEP = "rgb(168 134 71)";
  const CREAM = "rgb(250 246 239)";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ETHOS 행정사사무소 로고"
      role="img"
    >
      {/* 더블 링 (인장형) */}
      <circle cx="60" cy="60" r="55" fill="none" stroke={NAVY} strokeWidth="1.4" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={GOLD} strokeWidth="0.9" />

      {/* 상·하 골드 dot (12·6시 방향 — 인장 디테일) */}
      <circle cx="60" cy="7.5" r="1.7" fill={GOLD} />
      <circle cx="60" cy="112.5" r="1.7" fill={GOLD} />

      {/* 8각 컴퍼스 별 (Ethos / 방향·신뢰) */}
      <g transform="translate(60 31)">
        <path
          d="M0 -13 L2.6 -3.6 L13 0 L2.6 3.6 L0 13 L-2.6 3.6 L-13 0 L-2.6 -3.6 Z"
          fill={GOLD}
        />
        <path
          d="M0 -7 L1.4 -1.9 L7 0 L1.4 1.9 L0 7 L-1.4 1.9 L-7 0 L-1.4 -1.9 Z"
          fill={GOLD_DEEP}
        />
        <circle cx="0" cy="0" r="1.6" fill={CREAM} />
      </g>

      {/* 이오니아 기둥 (Logos / 이성) */}
      <g transform="translate(60 49)">
        {/* 주두 (capital) */}
        <rect x="-15" y="-5" width="30" height="4.5" rx="1.2" fill={NAVY} />
        {/* 볼류트 (양쪽 소용돌이) */}
        <circle cx="-12.5" cy="-2.7" r="2.6" fill="none" stroke={NAVY} strokeWidth="1.3" />
        <circle cx="12.5" cy="-2.7" r="2.6" fill="none" stroke={NAVY} strokeWidth="1.3" />
        {/* 기둥 몸체 + 플루팅 */}
        <rect x="-11" y="0" width="22" height="33" fill={NAVY} />
        <line x1="-6.6" y1="2.5" x2="-6.6" y2="30.5" stroke={CREAM} strokeWidth="0.85" />
        <line x1="-2.2" y1="2.5" x2="-2.2" y2="30.5" stroke={CREAM} strokeWidth="0.85" />
        <line x1="2.2" y1="2.5" x2="2.2" y2="30.5" stroke={CREAM} strokeWidth="0.85" />
        <line x1="6.6" y1="2.5" x2="6.6" y2="30.5" stroke={CREAM} strokeWidth="0.85" />
        {/* 주초 (base) */}
        <rect x="-13" y="33" width="26" height="3.4" rx="0.8" fill={NAVY} />
      </g>

      {/* 받침 아치 (Pathos / 공감) */}
      <path
        d="M 33 92 Q 40 83 52 87 Q 60 89.5 68 87 Q 80 83 87 92 Q 75 98 60 98 Q 45 98 33 92 Z"
        fill={GOLD}
      />
      {/* 아치 위 dot-matrix 악센트 (좌우 3점) */}
      <g fill={GOLD_DEEP}>
        <circle cx="44" cy="90.5" r="1" />
        <circle cx="60" cy="91.5" r="1" />
        <circle cx="76" cy="90.5" r="1" />
      </g>
    </svg>
  );
}

export function EthosWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-primary sm:text-5xl">
        ETHOS
      </h1>
      <p className="mt-1 font-serif text-sm font-semibold tracking-wide text-text-strong sm:text-base">
        Administrative Attorney Office
      </p>
      <p className="mt-2 font-serif text-xs italic text-gold-deep sm:text-sm">
        Reason in Process · Empathy for People · Trust in Every Step
      </p>
    </div>
  );
}
