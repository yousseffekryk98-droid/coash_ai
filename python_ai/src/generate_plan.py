from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from model_core import (
    ALLOWED_VALUES,
    FEATURE_WEIGHTS,
    RANGES,
    out_of_distribution_fields,
    predict_targets,
)

AI_ROOT = Path(__file__).resolve().parents[1]


@dataclass
class UserProfile:
    age: int
    weight_kg: float
    height_cm: float
    gender: str
    goal: str
    activity_level: str
    has_diabetes: int
    lactose_intolerant: int
    meals_per_day: int
    snacks_per_day: int
    liked_foods: list[str]
    disliked_foods: list[str]


def resolve_inside_ai_root(path_value: str) -> Path:
    candidate = Path(path_value)
    resolved = candidate.resolve() if candidate.is_absolute() else (Path.cwd() / candidate).resolve()
    if not resolved.is_relative_to(AI_ROOT):
        raise PermissionError(f'Access denied outside python_ai folder: {resolved}')
    return resolved


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate a coach-reviewed diet plan from the local model and food list.')
    parser.add_argument('--model', default='python_ai/models/diet_planner.json', help='Path to model file.')
    parser.add_argument('--profile', required=True, help='Path to user profile JSON.')
    parser.add_argument('--foods', required=True, help='Path to foods JSON array.')
    parser.add_argument('--out', default='python_ai/data/generated_plan.json', help='Output plan file path.')
    return parser.parse_args()


def _bounded_number(payload: dict[str, Any], field: str) -> float:
    value = float(payload[field])
    low, high = RANGES[field]
    if not low <= value <= high:
        raise ValueError(f'{field}={value} is outside supported range {low}..{high}')
    return value


def load_profile(path: Path) -> UserProfile:
    payload = json.loads(path.read_text(encoding='utf-8'))

    gender = str(payload['gender']).strip().lower()
    goal = str(payload['goal']).strip().lower()
    activity_level = str(payload['activity_level']).strip().lower()
    for field, value in [('gender', gender), ('goal', goal), ('activity_level', activity_level)]:
        if value not in ALLOWED_VALUES[field]:
            raise ValueError(f'{field}={value!r} is not supported')

    return UserProfile(
        age=int(round(_bounded_number(payload, 'age'))),
        weight_kg=_bounded_number(payload, 'weight_kg'),
        height_cm=_bounded_number(payload, 'height_cm'),
        gender=gender,
        goal=goal,
        activity_level=activity_level,
        has_diabetes=int(round(_bounded_number(payload, 'has_diabetes'))),
        lactose_intolerant=int(round(_bounded_number(payload, 'lactose_intolerant'))),
        meals_per_day=int(round(_bounded_number(payload, 'meals_per_day'))),
        snacks_per_day=int(round(_bounded_number(payload, 'snacks_per_day'))),
        liked_foods=[str(item) for item in payload.get('liked_foods', [])],
        disliked_foods=[str(item) for item in payload.get('disliked_foods', [])],
    )


def feature_row(profile: UserProfile) -> dict[str, Any]:
    return {
        'age': profile.age,
        'weight_kg': profile.weight_kg,
        'height_cm': profile.height_cm,
        'gender': profile.gender,
        'goal': profile.goal,
        'activity_level': profile.activity_level,
        'has_diabetes': profile.has_diabetes,
        'lactose_intolerant': profile.lactose_intolerant,
        'meals_per_day': profile.meals_per_day,
        'snacks_per_day': profile.snacks_per_day,
    }


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def apply_guardrails(predicted: dict[str, float], profile: UserProfile) -> tuple[dict[str, float], list[str]]:
    notes: list[str] = []

    raw_calories = float(predicted['target_calories'])
    calories = clamp(raw_calories, 1200, 5000)
    if calories != raw_calories:
        notes.append('Calories were clamped to the supported planning range.')

    protein_low = max(60.0, profile.weight_kg * 0.8)
    protein_high = min(300.0, profile.weight_kg * 2.5)
    raw_protein = float(predicted['target_protein'])
    protein = clamp(raw_protein, protein_low, protein_high)
    if protein != raw_protein:
        notes.append('Protein was adjusted to the configured body-weight guardrail range.')

    raw_fats = float(predicted['target_fats'])
    fats = clamp(raw_fats, 35.0, min(180.0, profile.weight_kg * 1.5))
    if fats != raw_fats:
        notes.append('Fat target was adjusted to the configured planning guardrail range.')

    energy_for_carbs = calories - protein * 4 - fats * 9
    carbs = max(50.0, energy_for_carbs / 4)
    if abs(carbs - float(predicted['target_carbs'])) > 25:
        notes.append('Carbohydrates were reconciled so macro energy stays close to the guarded calorie target.')

    guarded = {
        'calories': round(calories),
        'protein': round(protein, 1),
        'carbs': round(carbs, 1),
        'fats': round(fats, 1),
    }
    return guarded, notes


def select_foods(foods: list[dict[str, Any]], profile: UserProfile) -> list[dict[str, Any]]:
    liked = {item.casefold() for item in profile.liked_foods}
    disliked = {item.casefold() for item in profile.disliked_foods}

    filtered = []
    for food in foods:
        name = str(food.get('name', '')).strip()
        if not name or name.casefold() in disliked:
            continue
        if profile.lactose_intolerant and bool(food.get('containsLactose')):
            continue
        if profile.has_diabetes and str(food.get('glycemicIndex', '')).lower() == 'high':
            continue
        filtered.append(food)

    filtered.sort(key=lambda item: (0 if str(item.get('name', '')).casefold() in liked else 1, str(item.get('category', '')), str(item.get('name', ''))))
    return filtered


def build_plan(macros: dict[str, float], foods: list[dict[str, Any]], profile: UserProfile) -> dict[str, Any]:
    total_slots = profile.meals_per_day + profile.snacks_per_day
    if total_slots <= 0:
        raise ValueError('meals_per_day + snacks_per_day must be greater than 0')

    per_slot = {
        'calories': round(macros['calories'] / total_slots),
        'protein': round(macros['protein'] / total_slots, 1),
        'carbs': round(macros['carbs'] / total_slots, 1),
        'fats': round(macros['fats'] / total_slots, 1),
    }

    if not foods:
        return {
            'daily_targets': macros,
            'slot_targets': per_slot,
            'items': [],
            'notes': ['No foods are available after applying preferences and dietary filters.'],
        }

    by_category: dict[str, list[dict[str, Any]]] = {}
    for food in foods:
        by_category.setdefault(str(food.get('category', 'Other')), []).append(food)

    category_order = [key for key in ('Protein', 'Carb', 'Fat') if key in by_category]
    category_order.extend(key for key in sorted(by_category) if key not in category_order)

    items = []
    for index in range(total_slots):
        category = category_order[index % len(category_order)]
        options = by_category[category]
        food = options[(index // max(1, len(category_order))) % len(options)]
        items.append(
            {
                'slot': index + 1,
                'food': food['name'],
                'category': category,
                'target_macros': per_slot,
            }
        )

    return {
        'daily_targets': macros,
        'slot_targets': per_slot,
        'items': items,
        'notes': [
            'Plan respects liked/disliked foods.',
            'Lactose-containing foods are removed when lactose_intolerant = 1.',
            'High-GI foods are excluded from this planner when has_diabetes = 1.',
            'Food slots are suggestions only; exact portions still require coach review and a nutrient-complete food database.',
        ],
    }


def prediction_quality(model: dict[str, Any], profile_features: dict[str, Any], neighbor_meta: dict[str, Any], profile: UserProfile) -> dict[str, Any]:
    rows = list(model.get('rows', []))
    numeric_stats = model.get('numeric_stats', {})
    ood_fields = out_of_distribution_fields(profile_features, numeric_stats, rows)
    row_count = int(model.get('row_count', len(rows)))

    if row_count >= 100:
        confidence = 0.9
    elif row_count >= 50:
        confidence = 0.78
    elif row_count >= 20:
        confidence = 0.58
    elif row_count >= 10:
        confidence = 0.42
    else:
        confidence = 0.25

    confidence -= min(0.3, len(ood_fields) * 0.1)
    mean_distance = float(neighbor_meta.get('mean_neighbor_distance', 0))
    if mean_distance > 3:
        confidence -= 0.15
    elif mean_distance > 2:
        confidence -= 0.08
    confidence = round(clamp(confidence, 0.05, 0.95), 3)

    reasons: list[str] = []
    if row_count < 50:
        reasons.append(f'Model has only {row_count} unique training rows.')
    if ood_fields:
        reasons.append(f'Profile is outside the training distribution for: {", ".join(ood_fields)}.')
    if profile.has_diabetes:
        reasons.append('Diabetes mode requires coach/clinician-aware review; the planner does not make treatment decisions.')
    if profile.goal == 'competition_prep':
        reasons.append('Competition prep is high-context and should be reviewed by an experienced coach.')

    return {
        'confidence': confidence,
        'out_of_distribution_fields': ood_fields,
        'neighbor_summary': neighbor_meta,
        'requires_coach_review': confidence < 0.7 or bool(reasons),
        'review_reasons': reasons,
    }


def main() -> None:
    args = parse_args()
    model_path = resolve_inside_ai_root(args.model)
    profile_path = resolve_inside_ai_root(args.profile)
    foods_path = resolve_inside_ai_root(args.foods)
    out_path = resolve_inside_ai_root(args.out)

    if not model_path.exists():
        raise FileNotFoundError(f'Model not found: {model_path}. Run training first.')
    if not profile_path.exists():
        raise FileNotFoundError(f'Profile JSON not found: {profile_path}')
    if not foods_path.exists():
        raise FileNotFoundError(f'Foods JSON not found: {foods_path}')

    model = json.loads(model_path.read_text(encoding='utf-8'))
    profile = load_profile(profile_path)
    foods = json.loads(foods_path.read_text(encoding='utf-8'))
    if not isinstance(foods, list):
        raise ValueError('Foods JSON must contain an array.')

    features = feature_row(profile)
    rows = list(model.get('rows', []))
    selected_k = int(model.get('selected_k', 7))
    weights = model.get('feature_weights', FEATURE_WEIGHTS)
    predicted, neighbor_meta = predict_targets(rows, features, model['numeric_stats'], selected_k, weights)
    macros, guardrail_notes = apply_guardrails(predicted, profile)
    filtered_foods = select_foods(foods, profile)
    plan = build_plan(macros, filtered_foods, profile)
    quality = prediction_quality(model, features, neighbor_meta, profile)

    plan['prediction_quality'] = quality
    plan['guardrails_applied'] = guardrail_notes
    plan['model_info'] = {
        'model_type': model.get('model_type', 'knn_regression_stdlib'),
        'model_version': model.get('model_version', 'legacy-local-model'),
        'selected_k': selected_k,
        'training_rows': int(model.get('row_count', len(rows))),
        'evaluation': model.get('evaluation'),
    }
    plan['raw_prediction'] = {key: round(float(value), 2) for key, value in predicted.items()}

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(plan, indent=2), encoding='utf-8')
    print(f'Plan generated: {out_path}')
    print(f'Prediction confidence: {quality["confidence"]:.3f}')
    if quality['requires_coach_review']:
        print('Coach review required before using this plan with a client.')


if __name__ == '__main__':
    main()
