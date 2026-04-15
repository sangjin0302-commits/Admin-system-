import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma-client/client";
import { Pool } from "pg";
import { getDatabaseProvider, getDatabaseUrl } from "@/lib/prisma/config";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseProvider = getDatabaseProvider();
const databaseUrl = getDatabaseUrl();

function shouldRejectUnauthorized(databaseUrlValue: string) {
  const configured = process.env.PGSSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;

  const hostname = (() => {
    try {
      return new URL(databaseUrlValue).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  if (hostname.endsWith(".rlwy.net") || hostname === "postgres.railway.internal") {
    return false;
  }

  return true;
}

function createPrismaAdapter() {
  if (databaseProvider === "sqlite") {
    return new PrismaBetterSQLite3(
      {
        url: databaseUrl
      },
      {
        // Keep existing SQLite DateTime storage compatible with the native Prisma driver.
        timestampFormat: "unixepoch-ms"
      }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: shouldRejectUnauthorized(databaseUrl)
    }
  });

  return new PrismaPg(pool);
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter: createPrismaAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
