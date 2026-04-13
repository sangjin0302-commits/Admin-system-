export type SaveDocumentFileInput = {
  caseId: string;
  documentItemId?: string | null;
  originalFilename: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type SaveDocumentFileResult = {
  storedFilename: string;
  storagePath: string;
  size: number;
};

export interface DocumentStorageAdapter {
  save(input: SaveDocumentFileInput): Promise<SaveDocumentFileResult>;
  remove(storagePath: string): Promise<void>;
  read(storagePath: string): Promise<Buffer>;
  resolveAbsolutePath(storagePath: string): string;
}
