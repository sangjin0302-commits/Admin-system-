import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { hasRequiredRole, type AdminRole } from "@/lib/auth/roles";

const SESSION_COOKIE_NAME = "admin_office_session";
const SESSION_DAYS = 14;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type AuthSession = {
  sessionId: string;
  user: AuthUser;
  expiresAt: Date;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createExpiryDate() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_DAYS);
  return expiry;
}

function buildCookieConfig(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt
    }
  };
}

async function readSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function authenticateAdminUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || !user.isActive) {
    throw new AuthError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const verified = await verifyPassword(password, user.passwordHash);
  if (!verified) {
    throw new AuthError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  return user;
}

export async function createAdminSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const sessionToken = hashSessionToken(rawToken);
  const expiresAt = createExpiryDate();

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, buildCookieConfig(expiresAt).options);

  return session;
}

export async function clearAdminSession() {
  const token = await readSessionToken();
  if (token) {
    await prisma.userSession
      .deleteMany({
        where: { sessionToken: hashSessionToken(token) }
      })
      .catch(() => undefined);
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getOptionalAdminSession(): Promise<AuthSession | null> {
  const token = await readSessionToken();
  if (!token) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: { sessionToken: hashSessionToken(token) },
    include: {
      user: true
    }
  });

  if (!session || !session.user.isActive || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    }
  };
}

export async function requireAdminPageSession(nextPath = "/admin", requiredRole?: AdminRole) {
  const session = await getOptionalAdminSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
    throw new AuthError("권한이 부족합니다.", 403);
  }

  return session;
}

export async function requireAdminApiSession(requiredRole?: AdminRole) {
  const session = await getOptionalAdminSession();
  if (!session) {
    throw new AuthError("로그인이 필요합니다.", 401);
  }

  if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
    throw new AuthError("권한이 부족합니다.", 403);
  }

  return session;
}
