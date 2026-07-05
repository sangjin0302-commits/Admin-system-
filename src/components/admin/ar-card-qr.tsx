"use client";

/**
 * AR 명함 QR 코드.
 *
 * 실제 QR 인코더 라이브러리(qrcode 등)가 미설치이므로,
 * URL을 프레임에 넣은 단순 SVG 대체를 렌더합니다. qrcode 패키지가 추가되면
 * 이 컴포넌트를 실제 QR로 교체하세요.
 */

import { useRef } from "react";

type Props = {
  url: string;
  size?: number;
  label?: string;
};

/** URL 문자열을 해시하여 결정적인 시각 패턴을 만듭니다 (실제 QR 아님). */
function pattern(url: string, dim: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      h = (h * 1103515245 + 12345) >>> 0;
      grid[y][x] = (h & 1) === 1;
    }
  }
  // 파인더 패턴 (3 코너)
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = edge || inner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(dim - 7, 0);
  drawFinder(0, dim - 7);
  return grid;
}

export function ArCardQr({ url, size = 220, label = "AR 명함 QR" }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dim = 25;
  const grid = pattern(url, dim);
  const cell = size / dim;

  function download() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const dl = document.createElement("a");
    dl.href = URL.createObjectURL(blob);
    dl.download = "ethos-ar-card-qr.svg";
    dl.click();
    setTimeout(() => URL.revokeObjectURL(dl.href), 1000);
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={label}
        xmlns="http://www.w3.org/2000/svg"
        className="rounded bg-white p-2 ring-2 ring-gold/40"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {grid.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill="#163250"
              />
            ) : null,
          ),
        )}
      </svg>
      <div className="text-xs text-text-muted">{url}</div>
      <button
        type="button"
        onClick={download}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
      >
        SVG 다운로드
      </button>
    </div>
  );
}

export default ArCardQr;
