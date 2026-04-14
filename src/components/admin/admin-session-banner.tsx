import { LogoutButton } from "@/components/admin/logout-button";
import { Card } from "@/components/ui/card";
import { adminRoleLabels } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";

export function AdminSessionBanner({ session }: { session: AuthSession }) {
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ui-kicker">Admin Access</p>
          <p className="mt-1 text-sm text-text-strong">
            {session.user.name} · {session.user.email}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            역할: {adminRoleLabels[session.user.role]}
          </p>
        </div>
        <LogoutButton />
      </div>
    </Card>
  );
}
