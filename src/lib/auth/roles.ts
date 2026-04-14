export const adminRoleValues = ["ADMIN", "STAFF"] as const;
export type AdminRole = (typeof adminRoleValues)[number];

export const adminRoleLabels: Record<AdminRole, string> = {
  ADMIN: "관리자",
  STAFF: "스태프"
};

export function hasRequiredRole(currentRole: AdminRole, requiredRole: AdminRole) {
  const rank = {
    STAFF: 1,
    ADMIN: 2
  } satisfies Record<AdminRole, number>;

  return rank[currentRole] >= rank[requiredRole];
}
