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
    connectionString: databaseUrl
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
