export type PublicIntakeControlSnapshot = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  retryAfterSec: number;
  source: "env" | "db";
  updatedAt: string | null;
  updatedBy: string | null;
};

export type UpdatePublicIntakeControlInput = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  retryAfterSec?: number;
  updatedBy?: string;
  changeReason?: string;
};

export type PublicIntakeControlHistoryEntry = {
  id: string;
  importedAt: string;
  version: string;
  maintenanceMode: boolean | null;
  maintenanceMessage: string | null;
  retryAfterSec: number | null;
  updatedBy: string | null;
  changeReason: string | null;
};

export type PublicIntakeControlCapabilities = {
  writable: boolean;
  reason: string | null;
};
