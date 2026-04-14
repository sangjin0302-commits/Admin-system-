export const documentStorageDriverValues = ["local", "s3", "r2", "vercel-blob"] as const;

export type DocumentStorageDriver = (typeof documentStorageDriverValues)[number];

export function getDocumentStorageDriver(): DocumentStorageDriver {
  const configured = process.env.DOCUMENT_STORAGE_DRIVER?.trim();
  if (!configured) {
    return "local";
  }

  if (
    configured === "local" ||
    configured === "s3" ||
    configured === "r2" ||
    configured === "vercel-blob"
  ) {
    return configured;
  }

  throw new Error(`Unsupported DOCUMENT_STORAGE_DRIVER: ${configured}`);
}
