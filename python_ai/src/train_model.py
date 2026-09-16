from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from model_core import (
    FEATURE_COLUMNS,
    FEATURE_WEIGHTS,
    TARGET_COLUMNS,
    build_numeric_stats,
    evaluate_leave_one_out,
    target_distribution,
    validate_and_normalize_row,
)

AI_ROOT = Path(__file__).resolve().parents[1]


def resolve_inside_ai_root(path_value: str) -> Path:
    candidate = Path(path_value)
    resolved = candidate.resolve() if candidate.is_absolute() else (Path.cwd() / candidate).resolve()
    if not resolved.is_relative_to(AI_ROOT):
        raise PermissionError(f'Access denied outside python_ai folder: {resolved}')
    return resolved


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Train and evaluate the local coaching diet-target model.')
    parser.add_argument('--data', default='python_ai/data/training_data_template.csv', help='Path to training CSV.')
    parser.add_argument('--out', default='python_ai/models/diet_planner.json', help='Path to output model JSON.')
    parser.add_argument('--report', default='python_ai/models/diet_planner_report.json', help='Path to evaluation report JSON.')
    parser.add_argument('--k-candidates', default='1,3,5,7,9', help='Comma-separated K values evaluated with leave-one-out CV.')
    return parser.parse_args()


def load_rows(data_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
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

        raw_rows = [row for row in reader]

    if not raw_rows:
        raise ValueError('Training CSV has no data rows.')

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    duplicate_count = 0
    errors: list[str] = []

    for index, raw_row in enumerate(raw_rows, start=2):
        try:
            cleaned = validate_and_normalize_row(raw_row, row_number=index)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        fingerprint = json.dumps(cleaned, sort_keys=True)
        if fingerprint in seen:
            duplicate_count += 1
            continue
        seen.add(fingerprint)
        rows.append(cleaned)

    if errors:
        preview = '\n'.join(f'- {error}' for error in errors[:20])
        extra = '' if len(errors) <= 20 else f'\n...and {len(errors) - 20} more validation errors.'
        raise ValueError(f'Training data validation failed:\n{preview}{extra}')

    if not rows:
        raise ValueError('No valid unique training rows remain after validation.')

    return rows, {
        'input_rows': len(raw_rows),
        'accepted_rows': len(rows),
        'duplicates_removed': duplicate_count,
        'validation_errors': 0,
    }


def parse_k_candidates(raw_value: str, row_count: int) -> list[int]:
    candidates: set[int] = set()
    for token in raw_value.split(','):
        token = token.strip()
        if not token:
            continue
        try:
            value = int(token)
        except ValueError as exc:
            raise ValueError(f'Invalid k candidate: {token!r}') from exc
        if value > 0:
            candidates.add(value)

    if row_count <= 1:
        return [1]

    max_k = row_count - 1
    valid = sorted(value for value in candidates if value <= max_k)
    if not valid:
        valid = [1]
    return valid


def choose_k(rows: list[dict[str, Any]], numeric_stats: dict[str, dict[str, float]], candidates: list[int]) -> tuple[int, dict[str, Any]]:
    evaluations: dict[str, Any] = {}
    best_k = candidates[0]
    best_score = float('inf')

    for k in candidates:
        metrics = evaluate_leave_one_out(rows, numeric_stats, k, FEATURE_WEIGHTS)
        evaluations[str(k)] = metrics
        score = metrics.get('normalized_mae')
        if score is not None and float(score) < best_score:
            best_score = float(score)
            best_k = k

    return best_k, evaluations


def build_model(rows: list[dict[str, Any]], data_summary: dict[str, Any], k_candidates: list[int]) -> tuple[dict[str, Any], dict[str, Any]]:
    numeric_stats = build_numeric_stats(rows)
    selected_k, evaluations = choose_k(rows, numeric_stats, k_candidates)
    selected_metrics = evaluations.get(str(selected_k), {'samples': 0, 'normalized_mae': None, 'targets': {}})

    warnings: list[str] = []
    if len(rows) < 50:
        warnings.append(
            f'Only {len(rows)} unique rows are available. Treat predictions as experimental until substantially more real coach-reviewed data is collected.'
        )
    if len(rows) < 10:
        warnings.append('Dataset is too small for reliable generalization; confidence should remain low outside near-neighbor cases.')

    trained_at = datetime.now(timezone.utc).isoformat()
    model = {
        'schema_version': 2,
        'model_type': 'weighted_knn_regression_stdlib',
        'model_version': f'local-knn-v2-{trained_at[:10]}',
        'trained_at': trained_at,
        'feature_columns': FEATURE_COLUMNS,
        'target_columns': TARGET_COLUMNS,
        'feature_weights': FEATURE_WEIGHTS,
        'numeric_stats': numeric_stats,
        'selected_k': selected_k,
        'training_summary': data_summary,
        'target_distribution': target_distribution(rows),
        'evaluation': selected_metrics,
        'warnings': warnings,
        'rows': rows,
        'row_count': len(rows),
    }

    report = {
        'model_version': model['model_version'],
        'trained_at': trained_at,
        'selected_k': selected_k,
        'candidate_evaluations': evaluations,
        'training_summary': data_summary,
        'target_distribution': model['target_distribution'],
        'warnings': warnings,
    }
    return model, report


def main() -> None:
    args = parse_args()
    data_path = resolve_inside_ai_root(args.data)
    out_path = resolve_inside_ai_root(args.out)
    report_path = resolve_inside_ai_root(args.report)

    rows, data_summary = load_rows(data_path)
    candidates = parse_k_candidates(args.k_candidates, len(rows))
    model, report = build_model(rows, data_summary, candidates)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(model, indent=2), encoding='utf-8')
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')

    print(f'Training complete. Model saved to: {out_path}')
    print(f'Evaluation report saved to: {report_path}')
    print(f'Accepted unique rows: {model["row_count"]}')
    print(f'Selected k: {model["selected_k"]}')
    normalized_mae = model['evaluation'].get('normalized_mae')
    if normalized_mae is not None:
        print(f'Leave-one-out normalized MAE: {float(normalized_mae):.4f}')
    for warning in model['warnings']:
        print(f'WARNING: {warning}')


if __name__ == '__main__':
    main()
