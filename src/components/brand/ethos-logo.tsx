type Props = {
  size?: number;
  className?: string;
};

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
      <defs>
        {/* 금속 골드 그라디언트 */}
        <linearGradient id="el-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48b" />
          <stop offset="35%" stopColor="#c9a961" />
          <stop offset="60%" stopColor="#dfc374" />
          <stop offset="100%" stopColor="#a8882e" />
        </linearGradient>
        {/* 네이비 깊이감 */}
        <linearGradient id="el-navy" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#24537a" />
          <stop offset="100%" stopColor="#122c45" />
        </linearGradient>
        {/* 기둥 몸체 입체 */}
        <linearGradient id="el-pillar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#152f4e" />
          <stop offset="30%" stopColor="#1e4a6e" />
          <stop offset="70%" stopColor="#1e4a6e" />
          <stop offset="100%" stopColor="#0f2238" />
        </linearGradient>
        {/* 별빛 글로우 */}
        <radialGradient id="el-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#dfc374" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#dfc374" stopOpacity="0" />
        </radialGradient>
        {/* 바깥 원 그라디언트 */}
        <linearGradient id="el-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e4a6e" />
          <stop offset="50%" stopColor="#2a6090" />
          <stop offset="100%" stopColor="#122c45" />
        </linearGradient>
        {/* 손 금속 그라디언트 */}
        <linearGradient id="el-hand" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#dfc374" />
          <stop offset="50%" stopColor="#c9a961" />
          <stop offset="100%" stopColor="#a8882e" />
        </linearGradient>
        {/* 미세 내부 그림자 */}
        <filter id="el-inner">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feOffset dx="0" dy="1" result="off" />
          <feComposite in="off" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="comp" />
          <feFlood floodColor="#000" floodOpacity="0.2" result="color" />
          <feComposite in="color" in2="comp" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shadow" />
          </feMerge>
        </filter>
        {/* 드롭 쉐도우 */}
        <filter id="el-drop">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0a1929" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* 배경 서클 — 미세 그림자 */}
      <circle cx="60" cy="60" r="56" fill="none" stroke="url(#el-ring)" strokeWidth="1" opacity="0.3" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#el-ring)" strokeWidth="2.5" filter="url(#el-drop)" />

      {/* 안쪽 장식 원 */}
      <circle cx="60" cy="60" r="48" fill="none" stroke="url(#el-gold)" strokeWidth="0.5" opacity="0.4" />

      {/* 별빛 글로우 */}
      <circle cx="60" cy="30" r="16" fill="url(#el-glow)" />

      {/* 별빛 (Ethos) — 금속 골드 */}
      <g transform="translate(60 30)" filter="url(#el-drop)">
        <path
          d="M0 -12 L2.5 -3 L12 0 L2.5 3 L0 12 L-2.5 3 L-12 0 L-2.5 -3 Z"
          fill="url(#el-gold)"
        />
        <circle cx="0" cy="0" r="2.5" fill="#e8d48b" />
      </g>

      {/* 기둥 (Logos) — 입체 그라디언트 */}
      <g transform="translate(60 50)" filter="url(#el-inner)">
        {/* 캐피탈 */}
        <path d="M -14 0 Q -16 -2 -14 -4 L 14 -4 Q 16 -2 14 0 Z" fill="url(#el-navy)" />
        {/* 이오닉 볼류트 */}
        <circle cx="-12" cy="-2" r="2.5" fill="none" stroke="url(#el-navy)" strokeWidth="1.5" />
        <circle cx="12" cy="-2" r="2.5" fill="none" stroke="url(#el-navy)" strokeWidth="1.5" />
        {/* 기둥 몸체 — 좌우 음영 */}
        <rect x="-10" y="0" width="20" height="30" fill="url(#el-pillar)" />
        {/* 플루팅 (하이라이트) */}
        <line x1="-6" y1="2" x2="-6" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <line x1="-2" y1="2" x2="-2" y2="28" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <line x1="2" y1="2" x2="2" y2="28" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <line x1="6" y1="2" x2="6" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        {/* 받침 */}
        <rect x="-12" y="30" width="24" height="3" fill="url(#el-navy)" />
      </g>

      {/* 손 (Pathos) — 금속 골드 그라디언트 */}
      <path
        d="M 30 88 Q 35 78 45 82 Q 55 86 60 86 Q 65 86 75 82 Q 85 78 90 88 Q 80 95 60 95 Q 40 95 30 88 Z"
        fill="url(#el-hand)"
        filter="url(#el-drop)"
      />

      {/* 미세한 빛 반사 (top highlight) */}
      <ellipse cx="60" cy="18" rx="20" ry="3" fill="white" opacity="0.06" />
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
