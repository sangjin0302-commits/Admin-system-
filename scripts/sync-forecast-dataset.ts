import fsSync from "node:fs";
import { promises as fs } from "node:fs";
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

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  const { serializeWeeklyForecastDatasetCsv, syncWeeklyForecastDataset } = await import(
    "../src/lib/forecasting/service"
  );

  const rows = await syncWeeklyForecastDataset();
  const outputDir = path.join(process.cwd(), ".codex-tmp", "forecasting");
  const outputPath = path.join(outputDir, "weekly_forecast_dataset.csv");

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, serializeWeeklyForecastDatasetCsv(rows), "utf8");

  console.log(`Forecast dataset synced: ${rows.length} rows`);
  console.log(`CSV exported to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
