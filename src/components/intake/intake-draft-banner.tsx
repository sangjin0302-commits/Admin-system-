"use client";

type IntakeDraftBannerProps = {
  onRestore: () => void;
  onDismiss: () => void;
};

export function IntakeDraftBanner({ onRestore, onDismiss }: IntakeDraftBannerProps) {
  return (
    <div className="rounded-xl border border-gold/30 bg-[#c9a961]/10 px-5 py-4">
      <p className="mb-3 text-sm font-medium text-primary">
        이전에 작성하던 내용이 있습니다. 이어서 작성하시겠습니까?
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRestore}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold/90"
        >
          이어서 작성
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-gold/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-gold/10"
        >
          새로 시작
        </button>
      </div>
    </div>
  );
}
