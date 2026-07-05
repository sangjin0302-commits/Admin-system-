"use client";

/**
 * 홀로그래픽 3D 로고 — WebGL 기반 회전 로고.
 *
 * - 자동 서서히 회전 · 호버 시 가속
 * - Three.js 미설치 환경 → vanilla WebGL 폴백 (단순 회전 사면체)
 * - prefers-reduced-motion / WebGL 미지원 → 정적 SVG 폴백
 * - 브랜드 컬러: 골드(#c9a24a) + 네이비(#163250)
 */

import { useEffect, useRef, useState } from "react";

const GOLD = [0.788, 0.635, 0.29] as const; // #c9a24a
const NAVY = [0.086, 0.196, 0.314] as const; // #163250

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function StaticFallback({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary to-gold-deep p-6"
      aria-label={label}
      role="img"
    >
      <svg viewBox="0 0 200 200" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a24a" />
            <stop offset="100%" stopColor="#f4e5b3" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#holoGrad)" strokeWidth="2" opacity="0.6" />
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fontFamily="serif"
          fontWeight="700"
          fontSize="28"
          letterSpacing="6"
          fill="url(#holoGrad)"
        >
          ETHOS
        </text>
      </svg>
    </div>
  );
}

export function HoloLogo({ label = "ETHOS 3D 로고" }: { label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(reducedMotion());
  }, []);

  useEffect(() => {
    if (reduced || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glRaw = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!glRaw || typeof WebGLRenderingContext === "undefined" || !(glRaw instanceof WebGLRenderingContext)) {
      setFailed(true);
      return;
    }
    const gl: WebGLRenderingContext = glRaw;

    // 리사이즈 대응
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

    const vertexSrc = `
      attribute vec3 aPos;
      attribute vec3 aColor;
      uniform mat4 uMVP;
      varying vec3 vColor;
      void main() {
        gl_Position = uMVP * vec4(aPos, 1.0);
        vColor = aColor;
      }
    `;
    const fragSrc = `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    function compile(type: number, src: string): WebGLShader | null {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(sh);
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    // 정사면체 정점 (골드/네이비 교차 컬러)
    const s = 0.8;
    const verts = new Float32Array([
      // face 1
       s,  s,  s, ...GOLD,
      -s, -s,  s, ...GOLD,
      -s,  s, -s, ...NAVY,
      // face 2
       s,  s,  s, ...GOLD,
       s, -s, -s, ...NAVY,
      -s, -s,  s, ...GOLD,
      // face 3
       s,  s,  s, ...GOLD,
      -s,  s, -s, ...NAVY,
       s, -s, -s, ...NAVY,
      // face 4
      -s, -s,  s, ...GOLD,
       s, -s, -s, ...NAVY,
      -s,  s, -s, ...NAVY,
    ]);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const stride = 6 * 4;
    const aPos = gl.getAttribLocation(program, "aPos");
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 3 * 4);

    const uMVP = gl.getUniformLocation(program, "uMVP");
    gl.enable(gl.DEPTH_TEST);

    // MVP 행렬 (간단한 원근 + 회전)
    function mat4Mul(a: number[], b: number[]): number[] {
      const o = new Array(16).fill(0) as number[];
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
          for (let k = 0; k < 4; k++) o[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
      return o;
    }
    function perspective(fov: number, aspect: number, n: number, f: number): number[] {
      const t = 1 / Math.tan(fov / 2);
      return [
        t / aspect, 0, 0, 0,
        0, t, 0, 0,
        0, 0, (f + n) / (n - f), -1,
        0, 0, (2 * f * n) / (n - f), 0,
      ];
    }
    function rotateY(a: number): number[] {
      const c = Math.cos(a), s = Math.sin(a);
      return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
    }
    function rotateX(a: number): number[] {
      const c = Math.cos(a), s = Math.sin(a);
      return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
    }
    function translate(z: number): number[] {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1];
    }

    let angle = 0;
    let speed = 0.006; // 자동 서서히
    let hover = false;
    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; };
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);

    let raf = 0;
    const draw = () => {
      const target = hover ? 0.03 : 0.006;
      speed += (target - speed) * 0.08;
      angle += speed;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const proj = perspective(Math.PI / 4, aspect, 0.1, 10);
      const view = translate(-3);
      const model = mat4Mul(rotateY(angle), rotateX(angle * 0.6));
      const mvp = mat4Mul(mat4Mul(proj, view), model);
      gl.clearColor(0.055, 0.125, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uMVP, false, new Float32Array(mvp));
      gl.drawArrays(gl.TRIANGLES, 0, 12);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduced, failed]);

  if (reduced || failed) return <StaticFallback label={label} />;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label={label} />
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-gold/40" aria-hidden />
    </div>
  );
}

export default HoloLogo;
