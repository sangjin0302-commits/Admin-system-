import { Card } from "@/components/ui/card";

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
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="ui-kicker">{kicker}</p>
          <h2 className="mt-2 ui-page-title">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
