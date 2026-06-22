import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma/client";
import { verifyPassword } from "@/lib/auth/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/portal/signin"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // 1) Portal client (의뢰인)
        const client = await prisma.portalClient
          .findUnique({ where: { email } })
          .catch(() => null);
        if (client) {
          const ok = await verifyPassword(password, client.hashedPassword);
          if (ok) {
            return {
              id: client.id,
              email: client.email,
              name: client.name,
              userType: "portal",
            } as unknown as {
              id: string;
              email: string;
              name: string;
              userType: string;
            };
          }
        }

        // 2) AdminUser (소장/직원/외부협력/감사)
        const admin = await prisma.adminUser
          .findUnique({ where: { email } })
          .catch(() => null);
        if (admin && admin.active && admin.passwordHash) {
          const ok = await verifyPassword(password, admin.passwordHash);
          if (ok) {
            await prisma.adminUser
              .update({
                where: { id: admin.id },
                data: { lastLoginAt: new Date() },
              })
              .catch(() => undefined);
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              userType: "admin",
            } as unknown as {
              id: string;
              email: string;
              name: string;
              role: string;
              userType: string;
            };
          }
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          userType?: string;
        };
        token.id = u.id;
        if (u.role) (token as Record<string, unknown>).role = u.role;
        if (u.userType) (token as Record<string, unknown>).userType = u.userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as {
          id?: string;
          role?: string;
          userType?: string;
        };
        u.id = token.id as string;
        const t = token as Record<string, unknown>;
        if (t.role) u.role = t.role as string;
        if (t.userType) u.userType = t.userType as string;
      }
      return session;
    }
  }
});
