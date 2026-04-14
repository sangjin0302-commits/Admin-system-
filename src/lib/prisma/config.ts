export const databaseProviderValues = ["sqlite", "postgresql"] as const;

export type DatabaseProvider = (typeof databaseProviderValues)[number];

function inferDatabaseProvider(databaseUrl: string): DatabaseProvider {
  if (databaseUrl.startsWith("file:")) {
    return "sqlite";
  }

  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("prisma+postgres://")
  ) {
    return "postgresql";
  }

  throw new Error(`Unsupported DATABASE_URL scheme: ${databaseUrl}`);
}

export function getDatabaseProvider() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const explicitProvider = process.env.DATABASE_PROVIDER?.trim();
  if (explicitProvider) {
    if (explicitProvider === "sqlite" || explicitProvider === "postgresql") {
      return explicitProvider;
    }

    throw new Error(`Unsupported DATABASE_PROVIDER: ${explicitProvider}`);
  }

  return inferDatabaseProvider(databaseUrl);
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}
