export const ADMIN_AUTH_USER_ENV = "ADMIN_BASIC_AUTH_USER";
export const ADMIN_AUTH_PASSWORD_ENV = "ADMIN_BASIC_AUTH_PASSWORD";

export function getAdminBasicAuthCredentials() {
  const username = process.env[ADMIN_AUTH_USER_ENV]?.trim();
  const password = process.env[ADMIN_AUTH_PASSWORD_ENV]?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function isAdminBasicAuthConfigured() {
  return Boolean(getAdminBasicAuthCredentials());
}

export function buildBasicAuthValue(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}
