export type MobileSession = {
  deviceId: string;
  userId: string;
  pushToken?: string;
  platform: "ios" | "android";
  lastActiveAt: Date;
};

export type MobileApiResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

const sessions = new Map<string, MobileSession>();

export function registerDevice(
  session: Omit<MobileSession, "lastActiveAt">
): MobileSession {
  const full: MobileSession = { ...session, lastActiveAt: new Date() };
  sessions.set(full.deviceId, full);
  return full;
}

export function updatePushToken(deviceId: string, pushToken: string): boolean {
  const existing = sessions.get(deviceId);
  if (!existing) return false;
  existing.pushToken = pushToken;
  existing.lastActiveAt = new Date();
  sessions.set(deviceId, existing);
  return true;
}

export function getActiveDevices(): MobileSession[] {
  return Array.from(sessions.values());
}

export function removeDevice(deviceId: string): boolean {
  return sessions.delete(deviceId);
}
