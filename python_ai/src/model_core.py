from __future__ import annotations

import math
from statistics import mean, median
from typing import Any

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

CATEGORICAL_COLUMNS = ['gender', 'goal', 'activity_level']

FEATURE_WEIGHTS = {
    'age': 0.45,
    'weight_kg': 1.25,
    'height_cm': 0.45,
    'has_diabetes': 0.8,
    'lactose_intolerant': 0.15,
    'meals_per_day': 0.2,
    'snacks_per_day': 0.1,
    'gender': 0.35,
    'goal': 1.35,
    'activity_level': 1.15,
}

ALLOWED_VALUES = {
    'gender': {'female', 'male', 'other'},
    'goal': {'fat_loss', 'lean_bulk', 'maintenance', 'competition_prep'},
    'activity_level': {'inactive', 'lightly_active', 'active', 'very_active'},
}

RANGES = {
    'age': (13, 90),
    'weight_kg': (30, 300),
    'height_cm': (120, 230),
    'has_diabetes': (0, 1),
    'lactose_intolerant': (0, 1),
    'meals_per_day': (1, 8),
    'snacks_per_day': (0, 5),
    'target_calories': (1000, 6000),
    'target_protein': (30, 400),
    'target_carbs': (30, 800),
    'target_fats': (20, 250),
}


def _number(value: Any, field: str) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{field} must be numeric') from exc
    if not math.isfinite(parsed):
        raise ValueError(f'{field} must be finite')
    return parsed


def validate_and_normalize_row(row: dict[str, Any], row_number: int | None = None) -> dict[str, Any]:
    prefix = f'row {row_number}: ' if row_number is not None else ''
    missing = [column for column in FEATURE_COLUMNS + TARGET_COLUMNS if row.get(column) in (None, '')]
    if missing:
        raise ValueError(f'{prefix}missing required values: {missing}')

    cleaned: dict[str, Any] = {}
    for column in NUMERIC_COLUMNS + TARGET_COLUMNS:
        value = _number(row[column], column)
        low, high = RANGES[column]
        if not low <= value <= high:
            raise ValueError(f'{prefix}{column}={value} is outside supported range {low}..{high}')
        cleaned[column] = value

    for column in CATEGORICAL_COLUMNS:
        value = str(row[column]).strip().lower()
        if value not in ALLOWED_VALUES[column]:
            raise ValueError(f'{prefix}{column}={value!r} is not one of {sorted(ALLOWED_VALUES[column])}')
        cleaned[column] = value

    for integer_field in ('age', 'has_diabetes', 'lactose_intolerant', 'meals_per_day', 'snacks_per_day'):
        cleaned[integer_field] = int(round(cleaned[integer_field]))

    macro_calories = cleaned['target_protein'] * 4 + cleaned['target_carbs'] * 4 + cleaned['target_fats'] * 9
    declared_calories = cleaned['target_calories']
    mismatch = abs(macro_calories - declared_calories) / max(declared_calories, 1)
    if mismatch > 0.35:
        raise ValueError(
            f'{prefix}macro calories ({macro_calories:.0f}) differ from target_calories '
            f'({declared_calories:.0f}) by more than 35%'
        )

    return {
        'features': {column: cleaned[column] for column in FEATURE_COLUMNS},
        'targets': {column: cleaned[column] for column in TARGET_COLUMNS},
    }


def build_numeric_stats(rows: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    stats: dict[str, dict[str, float]] = {}
    for column in NUMERIC_COLUMNS:
        values = [float(row['features'][column]) for row in rows]
        min_value = min(values)
        max_value = max(values)
        stats[column] = {
            'min': min_value,
            'max': max_value,
            'range': max(max_value - min_value, 1.0),
            'mean': mean(values),
        }
    return stats


def distance(
    a: dict[str, Any],
    b: dict[str, Any],
    numeric_stats: dict[str, dict[str, float]],
    feature_weights: dict[str, float] | None = None,
) -> float:
    weights = feature_weights or FEATURE_WEIGHTS
    total = 0.0

    for column in NUMERIC_COLUMNS:
        range_value = max(float(numeric_stats[column]['range']), 1e-9)
        delta = abs(float(a[column]) - float(b[column])) / range_value
        total += delta * float(weights.get(column, 1.0))

    for column in CATEGORICAL_COLUMNS:
        mismatch = 0.0 if str(a[column]).lower() == str(b[column]).lower() else 1.0
        total += mismatch * float(weights.get(column, 1.0))

    return total


def predict_targets(
    train_rows: list[dict[str, Any]],
    row: dict[str, Any],
    numeric_stats: dict[str, dict[str, float]],
    k: int,
    feature_weights: dict[str, float] | None = None,
) -> tuple[dict[str, float], dict[str, Any]]:
    if not train_rows:
        raise ValueError('Model has no training rows')

    ranked: list[tuple[float, dict[str, Any]]] = []
    for item in train_rows:
        ranked.append((distance(row, item['features'], numeric_stats, feature_weights), item))
    ranked.sort(key=lambda item: item[0])

    neighbor_count = max(1, min(int(k), len(ranked)))
    neighbors = ranked[:neighbor_count]
    weighted_sums = {key: 0.0 for key in TARGET_COLUMNS}
    total_weight = 0.0

    for dist, item in neighbors:
        weight = 1.0 / max(dist, 1e-4)
        total_weight += weight
        for key in TARGET_COLUMNS:
            weighted_sums[key] += float(item['targets'][key]) * weight

    prediction = {key: weighted_sums[key] / total_weight for key in TARGET_COLUMNS}
    distances = [item[0] for item in neighbors]
    metadata = {
        'neighbor_count': neighbor_count,
        'nearest_distance': min(distances),
        'mean_neighbor_distance': mean(distances),
        'median_neighbor_distance': median(distances),
    }
    return prediction, metadata


def evaluate_leave_one_out(
    rows: list[dict[str, Any]],
    numeric_stats: dict[str, dict[str, float]],
    k: int,
    feature_weights: dict[str, float] | None = None,
) -> dict[str, Any]:
    if len(rows) < 2:
        return {'samples': 0, 'normalized_mae': None, 'targets': {}}

    absolute_errors = {key: [] for key in TARGET_COLUMNS}
    percentage_errors = {key: [] for key in TARGET_COLUMNS}

    for index, held_out in enumerate(rows):
        train_rows = rows[:index] + rows[index + 1 :]
        prediction, _ = predict_targets(train_rows, held_out['features'], numeric_stats, k, feature_weights)
        for key in TARGET_COLUMNS:
            actual = float(held_out['targets'][key])
            error = abs(prediction[key] - actual)
            absolute_errors[key].append(error)
            percentage_errors[key].append(error / max(abs(actual), 1.0))

    target_metrics: dict[str, Any] = {}
    normalized_scores: list[float] = []
    for key in TARGET_COLUMNS:
        mae = mean(absolute_errors[key])
        mape = mean(percentage_errors[key])
        target_metrics[key] = {
            'mae': round(mae, 3),
            'mape': round(mape, 5),
        }
        normalized_scores.append(mape)

    return {
        'samples': len(rows),
        'normalized_mae': round(mean(normalized_scores), 5),
        'targets': target_metrics,
    }


def target_distribution(rows: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    result: dict[str, dict[str, float]] = {}
    for key in TARGET_COLUMNS:
        values = [float(row['targets'][key]) for row in rows]
        result[key] = {
            'min': min(values),
            'max': max(values),
            'mean': round(mean(values), 3),
        }
    return result


def out_of_distribution_fields(
    row: dict[str, Any],
    numeric_stats: dict[str, dict[str, float]],
    training_rows: list[dict[str, Any]],
) -> list[str]:
    fields: list[str] = []
    for column in NUMERIC_COLUMNS:
        value = float(row[column])
        if value < float(numeric_stats[column]['min']) or value > float(numeric_stats[column]['max']):
            fields.append(column)

    for column in CATEGORICAL_COLUMNS:
        known = {str(item['features'][column]).lower() for item in training_rows}
        if str(row[column]).lower() not in known:
            fields.append(column)

    return fields
