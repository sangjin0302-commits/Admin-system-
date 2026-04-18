import {
  buildAdminSecurityItem,
  buildDatabaseItem,
  buildLawbotItem,
  buildNotionItem,
  buildPublicIntakeSecurityItem,
  buildRecommendedActions,
  buildStorageItem
} from "@/lib/services/system-health-check-builders";
import type {
  HealthCheckItem,
  HealthLevel,
  SystemHealthSnapshot
} from "@/lib/services/system-health-types";
import {
  getScoreByLevel,
  summarizeOverallLevel
} from "@/lib/services/system-health-utils";

export type { HealthCheckItem, HealthLevel, SystemHealthSnapshot };

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const items: HealthCheckItem[] = [
    buildAdminSecurityItem(),
    await buildPublicIntakeSecurityItem(),
    await buildDatabaseItem(),
    buildLawbotItem(),
    buildNotionItem(),
    await buildStorageItem()
  ];

  const score = Math.round(items.reduce((acc, item) => acc + getScoreByLevel(item.level), 0) / items.length);

  return {
    generatedAt: new Date().toISOString(),
    overallLevel: summarizeOverallLevel(items),
    score,
    items,
    recommendedActions: buildRecommendedActions(items)
  };
}
