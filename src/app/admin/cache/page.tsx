import { Card } from "@/components/ui/card";
import { cacheStats } from "@/lib/services/cache-service";

import { CacheControls } from "./cache-controls";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminCachePage() {
  const stats = cacheStats();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Performance</div>
        <h1 className="ui-page-title">Cache</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Entries</div>
              <div className="text-lg font-semibold">{stats.entries}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Estimated Size
              </div>
              <div className="text-lg font-semibold">
                {formatBytes(stats.estimatedSizeBytes)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hit Rate</div>
              <div className="text-lg font-semibold">
                {(stats.hitRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <CacheControls />
        </div>
      </Card>
    </div>
  );
}
