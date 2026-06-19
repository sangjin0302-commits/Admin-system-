import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getErrorStats,
  getRecentErrors
} from "@/lib/services/error-monitor-service";

import { ErrorList } from "./error-list";

export const dynamic = "force-dynamic";

type SearchParams = {
  level?: string;
  status?: string;
};

const LEVEL_FILTERS = ["all", "error", "warning", "info"] as const;
const STATUS_FILTERS = ["all", "unresolved"] as const;

export default async function AdminErrorsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const level = params.level ?? "all";
  const status = params.status ?? "all";

  const stats = getErrorStats();
  let errors = getRecentErrors(200, level);
  if (status === "unresolved") {
    errors = errors.filter((e) => !e.resolved);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Monitoring</div>
        <h1 className="ui-page-title">Error Monitor</h1>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            Total: <strong>{stats.total}</strong>
          </div>
          <div>
            Errors: <strong>{stats.byLevel.error ?? 0}</strong>
          </div>
          <div>
            Warnings: <strong>{stats.byLevel.warning ?? 0}</strong>
          </div>
          <div>
            Info: <strong>{stats.byLevel.info ?? 0}</strong>
          </div>
          <div>
            Unresolved: <strong>{stats.unresolved}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Level:</span>
            {LEVEL_FILTERS.map((f) => (
              <Link
                key={f}
                href={`/admin/errors?level=${f}&status=${status}`}
                className={`text-xs px-2 py-1 border rounded ${
                  level === f ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {f}
              </Link>
            ))}
            <span className="text-xs text-muted-foreground ml-4">Status:</span>
            {STATUS_FILTERS.map((s) => (
              <Link
                key={s}
                href={`/admin/errors?level=${level}&status=${s}`}
                className={`text-xs px-2 py-1 border rounded ${
                  status === s ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
          <ErrorList initialErrors={errors} />
        </div>
      </Card>
    </div>
  );
}
