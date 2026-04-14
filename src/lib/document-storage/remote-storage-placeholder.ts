import type {
  DocumentStorageAdapter,
  SaveDocumentFileInput,
  SaveDocumentFileResult
} from "@/lib/document-storage/types";

function buildMessage(driver: string) {
  return [
    `DOCUMENT_STORAGE_DRIVER=${driver} is selected, but no remote adapter is wired yet.`,
    "Keep local development on DOCUMENT_STORAGE_DRIVER=local,",
    "or implement the matching adapter before preview deployment."
  ].join(" ");
}

class RemoteStoragePlaceholderAdapter implements DocumentStorageAdapter {
  constructor(private readonly driver: string) {}

  async save(_input: SaveDocumentFileInput): Promise<SaveDocumentFileResult> {
    throw new Error(buildMessage(this.driver));
  }

  async remove(_storagePath: string): Promise<void> {
    throw new Error(buildMessage(this.driver));
  }

  async read(_storagePath: string): Promise<Buffer> {
    throw new Error(buildMessage(this.driver));
  }

  resolveAbsolutePath(storagePath: string) {
    return storagePath;
  }
}

export function createRemoteStoragePlaceholderAdapter(driver: string) {
  return new RemoteStoragePlaceholderAdapter(driver);
}
