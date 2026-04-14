# Forecasting Pilot

`admin-office-mvp` now includes a lightweight demand-forecasting layer for weekly workload prediction.

## Scope

- Internal operational history comes from existing app data:
  - `Inquiry`
  - accepted `Quote`
  - closed `CaseRecord`
  - `SupplementRequest`
- External numeric indicators are stored in `ExternalIndicatorObservation`
- Policy/seasonality tags are stored in `ForecastEventFlag`
- The merged weekly dataset is stored in `WeeklyForecastDataset`
- Forecast outputs are stored in:
  - `DemandForecastRun`
  - `DemandForecastPoint`

## Recommended operating cycle

1. Keep the normal admin workflow running as-is.
2. Add or sync weekly external indicators.
3. Add weekly event flags for policy, enforcement, or seasonal changes.
4. Generate the weekly forecast dataset:

```bash
npm run forecast:sync
```

5. Run TimesFM from a dedicated Python environment.
   Use the official repository and install flow from:
   [google-research/timesfm](https://github.com/google-research/timesfm)

Example:

```bash
python scripts/timesfm_forecast.py ^
  --input .codex-tmp/forecasting/weekly_forecast_dataset.csv ^
  --target-category FOREIGNER_VISA ^
  --target-metric INQUIRY_COUNT ^
  --horizon-weeks 8 ^
  --output .codex-tmp/forecasting/timesfm-output.json
```

6. Import the forecast results back into the app database:

```bash
npm run forecast:import -- --input .codex-tmp/forecasting/timesfm-output.json
```

## Notes

- Keep local development on SQLite.
- Run forecasting as a batch process, not inside request-time app code.
- Start with one target category such as `FOREIGNER_VISA`.
- Add only a few external indicators at first.
- Event flags are intentionally semi-manual.

## Future extension

- Add a dedicated `/admin/forecasting` workspace
- Schedule weekly dataset sync and forecast runs
- Let Railway workers reuse the same PostgreSQL + R2 env for background forecasting jobs
