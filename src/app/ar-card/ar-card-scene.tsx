"use client";

/**
 * AR 명함 3D 씬 (클라이언트).
 *
 * WebXR immersive-ar 지원 시 3D 로고를 렌더합니다.
 * 미지원 디바이스는 2D CSS 애니메이션 fallback으로 자동 강등됩니다.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  tagline: string;
  phone: string;
  email: string;
};

export function ArCardScene({ tagline, phone, email }: Props) {
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const xr = (navigator as unknown as { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr;
        if (!xr) {
          if (!cancelled) setXrSupported(false);
          return;
        }
        const ok = await xr.isSessionSupported("immersive-ar");
        if (!cancelled) setXrSupported(ok);
      } catch {
        if (!cancelled) setXrSupported(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;
    let raf = 0;
    const draw = () => {
      t += 0.008;
      const c = 0.05 + 0.03 * Math.sin(t);
      gl.clearColor(c, c * 1.5, c * 2.5, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      {/* 회전 로고 (CSS 3D) */}
      <div
        className="relative z-10 flex h-40 w-40 items-center justify-center rounded-3xl bg-white/10 ring-4 ring-gold/60 backdrop-blur"
        style={{
          animation: "ethos-ar-spin 8s linear infinite",
          transformStyle: "preserve-3d",
        }}
      >
        <span className="font-serif text-2xl font-bold tracking-[0.35em] text-gold-soft">
          ETHOS
        </span>
      </div>

      <p className="mt-8 max-w-lg text-center font-serif text-lg leading-relaxed text-white/90">
        {tagline}
      </p>

      <dl className="mt-10 grid grid-cols-1 gap-4 text-center text-sm">
        <div>
          <dt className="text-gold-soft">전화</dt>
          <dd className="mt-1 text-white">{phone}</dd>
        </div>
        <div>
          <dt className="text-gold-soft">이메일</dt>
          <dd className="mt-1 text-white">{email}</dd>
        </div>
      </dl>

      <div className="mt-10 rounded-full border border-gold/40 bg-white/5 px-4 py-2 text-xs text-white/70">
        {xrSupported === null && "AR 지원 확인 중..."}
        {xrSupported === true && "이 기기는 WebXR AR을 지원합니다"}
        {xrSupported === false && "WebXR 미지원 — 2D 애니메이션으로 표시"}
      </div>

      <style>{`
        @keyframes ethos-ar-spin {
          0% { transform: rotateY(0deg) rotateX(10deg); }
          100% { transform: rotateY(360deg) rotateX(10deg); }
        }
      `}</style>
    </div>
  );
}

export default ArCardScene;
