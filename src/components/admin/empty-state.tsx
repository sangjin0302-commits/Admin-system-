import Link from "next/link";

export type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

/**
 * 관리자 대시보드 통일 empty state.
 * - icon: emoji 문자 (예: "📭", "🔍")
 * - action: 있으면 링크 버튼 노출
 */
export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-4xl mb-3" aria-hidden>{icon}</div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-text-muted max-w-sm">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-full border border-line-strong bg-surface px-4 py-1.5 text-xs font-medium text-text hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
