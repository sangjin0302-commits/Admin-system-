export function normalizeAdminEntityId(raw: string) {
  const value = raw.trim();
  if (value.length < 6 || value.length > 64) return null;
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  return value;
}
