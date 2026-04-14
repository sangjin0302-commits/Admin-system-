import argparse
import csv
import json
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run a TimesFM demand forecast on the weekly forecast dataset exported from admin-office-mvp."
    )
    parser.add_argument("--input", required=True, help="Path to weekly_forecast_dataset.csv")
    parser.add_argument("--target-category", required=True, help="Category to forecast, e.g. FOREIGNER_VISA")
    parser.add_argument(
        "--target-metric",
        default="INQUIRY_COUNT",
        choices=["INQUIRY_COUNT", "CONTRACT_COUNT", "REVISION_REQUEST_COUNT"],
        help="Metric column to forecast",
    )
    parser.add_argument("--target-channel", default=None, help="Optional intake channel filter")
    parser.add_argument("--horizon-weeks", type=int, default=8, help="How many weeks to predict")
    parser.add_argument(
        "--model-name",
        default="google/timesfm-2.5-200m-pytorch",
        help="Hugging Face TimesFM checkpoint id",
    )
    parser.add_argument(
        "--output",
        default=".codex-tmp/forecasting/timesfm-output.json",
        help="Where to write the forecast JSON payload",
    )
    return parser.parse_args()


def week_increment(week_start: date, steps: int) -> date:
    return week_start + timedelta(days=7 * steps)


def read_rows(csv_path: Path) -> Iterable[dict[str, str]]:
    with csv_path.open("r", encoding="utf8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            yield row


def aggregate_history(rows: Iterable[dict[str, str]], category: str, metric: str, channel: str | None):
    values_by_week: dict[date, float] = defaultdict(float)

    metric_column = {
        "INQUIRY_COUNT": "inquiryCount",
        "CONTRACT_COUNT": "contractCount",
        "REVISION_REQUEST_COUNT": "revisionRequestCount",
    }[metric]

    for row in rows:
        if row["category"] != category:
            continue
        if channel and (row.get("channel") or "") != channel:
            continue

        week_start = date.fromisoformat(row["weekStartDate"])
        values_by_week[week_start] += float(row[metric_column] or 0)

    if not values_by_week:
        raise SystemExit(f"No history found for category={category!r} channel={channel!r}")

    ordered_weeks = sorted(values_by_week.keys())
    ordered_values = [values_by_week[week] for week in ordered_weeks]
    return ordered_weeks, ordered_values


def load_timesfm():
    try:
        import timesfm  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "timesfm is not installed. Create a dedicated Python environment, install TimesFM from "
            "https://github.com/google-research/timesfm, and rerun this script."
        ) from exc

    return timesfm


def run_forecast(history: list[float], horizon_weeks: int, model_name: str):
    timesfm = load_timesfm()

    model = timesfm.TimesFm(
        hparams=timesfm.TimesFmHparams(
            backend="cpu",
            per_core_batch_size=32,
            horizon_len=horizon_weeks,
        ),
        checkpoint=timesfm.TimesFmCheckpoint(
            huggingface_repo_id=model_name
        ),
    )

    point_forecast, full_forecast = model.forecast(
        [history],
        freq=[0],
    )

    point_values = point_forecast[0].tolist() if hasattr(point_forecast[0], "tolist") else list(point_forecast[0])
    quantile_values = (
        full_forecast[0].tolist() if hasattr(full_forecast[0], "tolist") else list(full_forecast[0])
    )

    return point_values, quantile_values


def main():
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    rows = list(read_rows(input_path))
    ordered_weeks, history = aggregate_history(rows, args.target_category, args.target_metric, args.target_channel)
    point_values, quantile_values = run_forecast(history, args.horizon_weeks, args.model_name)

    last_week = ordered_weeks[-1]
    points = []
    for index, predicted_value in enumerate(point_values):
        target_week_start = week_increment(last_week, index + 1)
        lower_bound = None
        upper_bound = None

        if index < len(quantile_values):
            horizon_slice = quantile_values[index]
            if isinstance(horizon_slice, list) and len(horizon_slice) >= 3:
                lower_bound = float(horizon_slice[1])
                upper_bound = float(horizon_slice[-1])

        points.append(
            {
                "targetWeekStart": target_week_start.isoformat(),
                "predictedValue": float(predicted_value),
                "lowerBound": lower_bound,
                "upperBound": upper_bound,
                "actualValue": None,
            }
        )

    payload = {
        "targetMetric": args.target_metric,
        "targetCategory": args.target_category,
        "targetChannel": args.target_channel,
        "horizonWeeks": args.horizon_weeks,
        "modelName": "TimesFM",
        "modelVersion": args.model_name,
        "sourceWindowWeeks": len(history),
        "status": "COMPLETED",
        "contextJson": {
          "historyWeeks": [week.isoformat() for week in ordered_weeks],
          "historyValues": history,
        },
        "note": "Generated by scripts/timesfm_forecast.py using the official Google Research TimesFM API shape.",
        "points": points,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")
    print(f"Forecast written to {output_path}")


if __name__ == "__main__":
    main()
