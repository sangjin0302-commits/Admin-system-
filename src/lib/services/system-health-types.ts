export type HealthLevel = "ok" | "warn" | "critical";

export type HealthCheckItem = {
  key: string;
  title: string;
  level: HealthLevel;
  summary: string;
  details: string[];
};

export type SystemHealthSnapshot = {
  generatedAt: string;
  overallLevel: HealthLevel;
  score: number;
  items: HealthCheckItem[];
  recommendedActions: string[];
};
