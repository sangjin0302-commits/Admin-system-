"use client";

import { useState } from "react";

type Props = {
  url: string;
  mimeType: string;
  fileName: string;
};

export function DocumentPreview({ url, mimeType, fileName }: Props) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
      >
        미리보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="truncate font-serif text-sm font-bold text-primary">{fileName}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-primary"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[80vh] overflow-auto bg-canvas">
              {isPdf ? (
                <div className="h-[80vh]">
                  <iframe
                    src={url}
                    title={fileName}
                    className="h-full w-full"
                  />
                  <p className="p-3 text-center text-xs text-text-muted">
                    표시되지 않으면{" "}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      여기를 클릭
                    </a>
                    하여 다운로드하세요.
                  </p>
                </div>
              ) : isImage ? (
                <div className="p-4 text-center">
                  <img
                    src={url}
                    alt={fileName}
                    onClick={() => setZoomed((z) => !z)}
                    className={
                      zoomed
                        ? "max-w-none cursor-zoom-out"
                        : "mx-auto max-h-[75vh] cursor-zoom-in"
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-12 w-12 text-gold-deep"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <p className="text-sm text-text-muted">
                    미리보기를 지원하지 않는 파일 형식입니다.
                  </p>
                  <a
                    href={url}
                    download={fileName}
                    className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition hover:bg-text-strong"
                  >
                    다운로드
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
