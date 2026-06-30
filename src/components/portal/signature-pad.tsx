"use client";

import { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSign, width = 500, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }

  function endDraw() {
    setIsDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function submit() {
    if (!hasSignature || !canvasRef.current) return;
    onSign(canvasRef.current.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      <p className="font-serif text-sm font-bold text-primary">서명란</p>
      <div className="rounded-xl border-2 border-dashed border-gold/40 bg-white p-1">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-gold/30 bg-surface px-4 py-2 text-xs font-bold text-text-muted transition hover:bg-gold-soft/30"
        >
          다시 그리기
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!hasSignature}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-text-strong disabled:opacity-40"
        >
          서명 확인
        </button>
      </div>
      <p className="text-[11px] text-text-muted">
        위 서명은 전자서명법에 따라 수기 서명과 동일한 효력을 가집니다.
      </p>
    </div>
  );
}
