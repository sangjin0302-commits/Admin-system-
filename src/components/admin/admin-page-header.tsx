export function AdminPageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="admin-card-static">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="ui-kicker">{kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text-strong">{title}</h2>
          {description && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
