type Props = {
  size?: number;
  className?: string;
};

/**
 * ETHOS 브랜드 로고
 * 기둥(Logos) + 별빛(Ethos) + 손(Pathos) + 원형 라인
 */
export function EthosLogo({ size = 64, className }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ETHOS 행정사사무소 로고"
    >
      {/* 원형 라인 (Pathos / 보호) */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(26 60 95)" strokeWidth="2.5" />

      {/* 별빛 (Ethos / 방향) */}
      <g transform="translate(60 30)">
        <path
          d="M0 -12 L2 -2 L12 0 L2 2 L0 12 L-2 2 L-12 0 L-2 -2 Z"
          fill="rgb(201 169 97)"
        />
        <circle cx="0" cy="0" r="2.5" fill="rgb(201 169 97)" />
      </g>

      {/* 기둥 (Logos / 이성) */}
      <g transform="translate(60 50)">
        {/* 기둥 머리 (capital) */}
        <path
          d="M -14 0 Q -16 -2 -14 -4 L 14 -4 Q 16 -2 14 0 Z"
          fill="rgb(26 60 95)"
        />
        {/* 볼류트 (ionic scrolls) */}
        <circle cx="-12" cy="-2" r="2.5" fill="none" stroke="rgb(26 60 95)" strokeWidth="1.5" />
        <circle cx="12" cy="-2" r="2.5" fill="none" stroke="rgb(26 60 95)" strokeWidth="1.5" />
        {/* 기둥 몸체 (fluted shaft) */}
        <rect x="-10" y="0" width="20" height="30" fill="rgb(26 60 95)" />
        <line x1="-6" y1="2" x2="-6" y2="28" stroke="rgb(250 246 239)" strokeWidth="0.8" />
        <line x1="-2" y1="2" x2="-2" y2="28" stroke="rgb(250 246 239)" strokeWidth="0.8" />
        <line x1="2" y1="2" x2="2" y2="28" stroke="rgb(250 246 239)" strokeWidth="0.8" />
        <line x1="6" y1="2" x2="6" y2="28" stroke="rgb(250 246 239)" strokeWidth="0.8" />
        {/* 기둥 받침 */}
        <rect x="-12" y="30" width="24" height="3" fill="rgb(26 60 95)" />
      </g>

      {/* 손 (Pathos / 공감) — 기둥을 받치는 손 */}
      <path
        d="M 30 88 Q 35 78 45 82 Q 55 86 60 86 Q 65 86 75 82 Q 85 78 90 88 Q 80 95 60 95 Q 40 95 30 88 Z"
        fill="rgb(201 169 97)"
      />
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
