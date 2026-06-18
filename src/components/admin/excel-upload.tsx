"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

type UploadResult = {
  total: number;
  created: number;
  errors: string[];
};

export function ExcelUpload({
  endpoint,
  label = "Excel/CSV 일괄 등록",
  accept = ".csv,.xlsx,.xls",
  onComplete,
}: {
  endpoint: string;
  label?: string;
  accept?: string;
  onComplete?: (result: UploadResult) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("파일을 선택해주세요.");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "업로드 실패");
        return;
      }

      const uploadResult: UploadResult = {
        total: data.total ?? 0,
        created: data.created ?? 0,
        errors: data.errors ?? [],
      };
      setResult(uploadResult);
      toast.success(`${uploadResult.created}건 등록 완료`);
      onComplete?.(uploadResult);

      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
      <h3 className="text-sm font-semibold text-text-strong">{label}</h3>
      <p className="mt-1 text-xs text-text-muted">
        CSV 또는 Excel 파일을 선택하여 데이터를 일괄 등록합니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-2.5 text-sm transition hover:border-primary hover:bg-primary/5">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="text-text-strong">파일 선택</span>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-50"
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
          <div className="flex gap-4 text-sm">
            <span className="text-text-muted">전체: <strong className="text-text-strong">{result.total}건</strong></span>
            <span className="text-success">성공: <strong>{result.created}건</strong></span>
            {result.errors.length > 0 && (
              <span className="text-danger">오류: <strong>{result.errors.length}건</strong></span>
            )}
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-danger">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i} className="mt-0.5">• {err}</li>
              ))}
              {result.errors.length > 10 && (
                <li className="mt-1 text-text-muted">... 외 {result.errors.length - 10}건</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
