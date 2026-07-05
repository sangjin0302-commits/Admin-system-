"use client";

import { usePresence } from "@/lib/hooks/use-admin-presence";

/**
 * "N명 접속 중" 뱃지 + 특정 엔티티 편집 락 경고.
 * entityType/entityId 미지정 시 접속자 수만 표시.
 */
export function PresenceIndicator({
  entityType,
  entityId,
  currentAdminEmail,
}: {
  entityType?: string;
  entityId?: string;
  currentAdminEmail?: string;
}) {
  const { activeAdmins, currentEditor } =
    entityType && entityId
      ? usePresence({ entityType, entityId })
      : usePresence();

  const others = activeAdmins.filter((p) => p.adminId !== currentAdminEmail);
  const otherEditor =
    currentEditor && currentEditor.adminId !== currentAdminEmail ? currentEditor : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-text-muted">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        {activeAdmins.length}명 접속 중
        {others.length > 0 && (
          <span className="ml-1 text-text-muted/70">
            ({others
              .slice(0, 3)
              .map((p) => p.adminName ?? p.adminId)
              .join(", ")}
            {others.length > 3 ? ` 외 ${others.length - 3}` : ""})
          </span>
        )}
      </span>
      {otherEditor && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-800">
          <span aria-hidden>⚠</span>
          {otherEditor.adminName ?? otherEditor.adminId} 편집 중
        </span>
      )}
    </div>
  );
}
