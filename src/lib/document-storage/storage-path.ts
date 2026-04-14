import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SaveDocumentFileInput } from "@/lib/document-storage/types";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildDocumentStoragePath(input: SaveDocumentFileInput) {
  const safeName = sanitizeFilename(input.originalFilename || "file");
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomUUID().slice(0, 8);
  const filename = `${datePart}-${randomPart}-${safeName}`;
  const folder = input.documentItemId
    ? path.join("cases", input.caseId, input.documentItemId)
    : path.join("cases", input.caseId, "uncategorized");

  return {
    storagePath: path.join(folder, filename).replaceAll("\\", "/"),
    storedFilename: filename
  };
}
