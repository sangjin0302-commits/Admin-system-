import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  DocumentStorageAdapter,
  SaveDocumentFileInput,
  SaveDocumentFileResult
} from "@/lib/document-storage/types";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getUploadRoot() {
  const configured = process.env.DOCUMENT_UPLOAD_DIR?.trim();
  return configured && configured.length > 0 ? configured : "uploads";
}

function buildStoragePath(input: SaveDocumentFileInput) {
  const safeName = sanitizeFilename(input.originalFilename || "file");
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomUUID().slice(0, 8);
  const filename = `${datePart}-${randomPart}-${safeName}`;
  const folder = input.documentItemId
    ? path.join("cases", input.caseId, input.documentItemId)
    : path.join("cases", input.caseId, "uncategorized");

  return {
    storagePath: path.join(folder, filename),
    storedFilename: filename
  };
}

class LocalDocumentStorageAdapter implements DocumentStorageAdapter {
  private rootDir = path.resolve(process.cwd(), getUploadRoot());

  async save(input: SaveDocumentFileInput): Promise<SaveDocumentFileResult> {
    const { storagePath, storedFilename } = buildStoragePath(input);
    const absolutePath = this.resolveAbsolutePath(storagePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.bytes);

    return {
      storedFilename,
      storagePath: storagePath.replaceAll("\\", "/"),
      size: input.bytes.byteLength
    };
  }

  async remove(storagePath: string) {
    const absolutePath = this.resolveAbsolutePath(storagePath);
    await fs.rm(absolutePath, { force: true });
  }

  async read(storagePath: string) {
    const absolutePath = this.resolveAbsolutePath(storagePath);
    return fs.readFile(absolutePath);
  }

  resolveAbsolutePath(storagePath: string) {
    return path.resolve(this.rootDir, storagePath);
  }
}

export function createLocalDocumentStorageAdapter() {
  return new LocalDocumentStorageAdapter();
}
