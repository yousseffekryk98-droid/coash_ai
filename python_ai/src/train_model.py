from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parents[1]

FEATURE_COLUMNS = [
    'age',
    'weight_kg',
    'height_cm',
    'gender',
    'goal',
    'activity_level',
    'has_diabetes',
    'lactose_intolerant',
    'meals_per_day',
    'snacks_per_day',
]

TARGET_COLUMNS = [
    'target_calories',
    'target_protein',
    'target_carbs',
    'target_fats',
]

NUMERIC_COLUMNS = [
    'age',
    'weight_kg',
    'height_cm',
    'has_diabetes',
    'lactose_intolerant',
    'meals_per_day',
    'snacks_per_day',
]


def resolve_inside_ai_root(path_value: str) -> Path:
    candidate = Path(path_value)
    resolved = candidate.resolve() if candidate.is_absolute() else (Path.cwd() / candidate).resolve()
    if not resolved.is_relative_to(AI_ROOT):
        raise PermissionError(f'Access denied outside python_ai folder: {resolved}')
    return resolved


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Train a free local diet-planning model (stdlib only).')
    parser.add_argument('--data', default='python_ai/data/training_data_template.csv', help='Path to training CSV.')
    parser.add_argument('--out', default='python_ai/models/diet_planner.json', help='Path to output model JSON.')
    return parser.parse_args()


def load_rows(data_path: Path) -> list[dict[str, str]]:
    if not data_path.exists():
        raise FileNotFoundError(f'Training data not found: {data_path}')

    with data_path.open('r', encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError('CSV has no header row.')

        required = FEATURE_COLUMNS + TARGET_COLUMNS
        missing = [column for column in required if column not in reader.fieldnames]
        if missing:
            raise ValueError(f'Missing required columns: {missing}')

        rows = [row for row in reader]

    if not rows:
        raise ValueError('Training CSV has no data rows.')

    return rows


def build_model(rows: list[dict[str, str]]) -> dict:
    numeric_stats = {}
    for column in NUMERIC_COLUMNS:
        values = [float(row[column]) for row in rows]
        min_value = min(values)
        max_value = max(values)
        range_value = max(max_value - min_value, 1.0)
        numeric_stats[column] = {'min': min_value, 'max': max_value, 'range': range_value}

    encoded_rows = []
    for row in rows:
        encoded_rows.append(
            {
                'features': {key: row[key] for key in FEATURE_COLUMNS},
                'targets': {
                    'target_calories': float(row['target_calories']),
                    'target_protein': float(row['target_protein']),
                    'target_carbs': float(row['target_carbs']),
                    'target_fats': float(row['target_fats']),
                },
            }
        )

    return {
        'model_type': 'knn_regression_stdlib',
        'feature_columns': FEATURE_COLUMNS,
        'target_columns': TARGET_COLUMNS,
        'numeric_columns': NUMERIC_COLUMNS,
        'numeric_stats': numeric_stats,
        'rows': encoded_rows,
        'row_count': len(encoded_rows),
    }


def main() -> None:
    args = parse_args()
    data_path = resolve_inside_ai_root(args.data)
    out_path = resolve_inside_ai_root(args.out)

    rows = load_rows(data_path)
    model = build_model(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(model, indent=2), encoding='utf-8')

    print(f'Training complete. Model saved to: {out_path}')
    print(f'Trained on {len(rows)} rows.')


if __name__ == '__main__':
    main()
