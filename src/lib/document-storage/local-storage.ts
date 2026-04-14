import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  DocumentStorageAdapter,
  SaveDocumentFileInput,
  SaveDocumentFileResult
} from "@/lib/document-storage/types";
import { buildDocumentStoragePath } from "@/lib/document-storage/storage-path";

function getUploadRoot() {
  const configured =
    process.env.LOCAL_DOCUMENT_UPLOAD_DIR?.trim() || process.env.DOCUMENT_UPLOAD_DIR?.trim();
  return configured && configured.length > 0 ? configured : "uploads";
}

class LocalDocumentStorageAdapter implements DocumentStorageAdapter {
  private rootDir = path.resolve(process.cwd(), getUploadRoot());

  async save(input: SaveDocumentFileInput): Promise<SaveDocumentFileResult> {
    const { storagePath, storedFilename } = buildDocumentStoragePath(input);
    const absolutePath = this.resolveAbsolutePath(storagePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.bytes);

    return {
      storedFilename,
      storagePath,
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
