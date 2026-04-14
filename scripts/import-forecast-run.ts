import fsSync from "node:fs";
import path from "node:path";

function loadEnvFile(filePath: string) {
  if (!fsSync.existsSync(filePath)) return;

  const content = fsSync.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getArgument(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  const { storeDemandForecastRun } = await import("../src/lib/forecasting/service");

  const inputPath = getArgument("--input");

  if (!inputPath) {
    throw new Error("Missing --input path. Example: tsx scripts/import-forecast-run.ts --input .codex-tmp/forecasting/timesfm-output.json");
  }

  const absolutePath = path.resolve(process.cwd(), inputPath);
  const payload = JSON.parse(fsSync.readFileSync(absolutePath, "utf8"));

  if (!Array.isArray(payload.points) || payload.points.length === 0) {
    throw new Error("Forecast payload must include a non-empty points array.");
  }

  const stored = await storeDemandForecastRun({
    targetMetric: payload.targetMetric,
    targetCategory: payload.targetCategory,
    targetChannel: payload.targetChannel ?? null,
    horizonWeeks: payload.horizonWeeks,
    modelName: payload.modelName,
    modelVersion: payload.modelVersion ?? null,
    sourceWindowWeeks: payload.sourceWindowWeeks,
    status: payload.status ?? "COMPLETED",
    contextJson: payload.contextJson ? JSON.stringify(payload.contextJson) : null,
    note: payload.note ?? null,
    completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
    points: payload.points.map((point: Record<string, unknown>) => ({
      targetWeekStart: new Date(String(point.targetWeekStart)),
      predictedValue: Number(point.predictedValue),
      lowerBound: point.lowerBound == null ? null : Number(point.lowerBound),
      upperBound: point.upperBound == null ? null : Number(point.upperBound),
      actualValue: point.actualValue == null ? null : Number(point.actualValue)
    }))
  });

  console.log(`Stored demand forecast run ${stored.id} with ${stored.points.length} points`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
