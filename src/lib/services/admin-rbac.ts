/**
 * Admin Role-Based Access Control
 *
 * Roles are loaded from the ADMIN_ROLES env var (JSON object mapping email → role).
 * Any authenticated user not listed defaults to ADMIN.
 */

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  VIEWER = "VIEWER",
}

/** All known actions in the admin panel. */
export const ADMIN_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

/**
 * Permission matrix: role → set of allowed actions.
 */
const PERMISSIONS: Record<AdminRole, ReadonlySet<AdminAction>> = {
  [AdminRole.SUPER_ADMIN]: new Set<AdminAction>(["view", "create", "update", "delete"]),
  [AdminRole.ADMIN]: new Set<AdminAction>(["view", "create", "update"]),
  [AdminRole.VIEWER]: new Set<AdminAction>(["view"]),
};

/**
 * Check whether the given role is permitted to perform the action.
 */
export function checkPermission(role: AdminRole, action: string): boolean {
  const allowed = PERMISSIONS[role];
  return allowed ? allowed.has(action as AdminAction) : false;
}

/**
 * Resolve admin role for a given email address.
 *
 * Reads from ADMIN_ROLES env var which should be JSON like:
 *   {"admin@example.com":"SUPER_ADMIN","viewer@example.com":"VIEWER"}
 *
 * Falls back to ADMIN for any authenticated user not listed.
 */
export function getAdminRole(email: string): AdminRole {
  const raw = process.env.ADMIN_ROLES;
  if (raw) {
    try {
      const map: Record<string, string> = JSON.parse(raw);
      const role = map[email];
      if (role && Object.values(AdminRole).includes(role as AdminRole)) {
        return role as AdminRole;
      }
    } catch {
      console.error("[admin-rbac] failed to parse ADMIN_ROLES env var");
    }
  }
  return AdminRole.ADMIN;
}

/** Exported for the settings page permission matrix display. */
export const PERMISSION_MATRIX = Object.fromEntries(
  Object.values(AdminRole).map((role) => [
    role,
    Object.fromEntries(ADMIN_ACTIONS.map((a) => [a, PERMISSIONS[role].has(a)])),
  ])
) as Record<AdminRole, Record<AdminAction, boolean>>;
