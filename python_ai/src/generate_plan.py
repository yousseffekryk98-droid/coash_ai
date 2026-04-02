from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

AI_ROOT = Path(__file__).resolve().parents[1]

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
    parser = argparse.ArgumentParser(description='Generate a diet plan from local model and food list.')
    parser.add_argument('--model', default='python_ai/models/diet_planner.json', help='Path to model file.')
    parser.add_argument('--profile', required=True, help='Path to user profile JSON.')
    parser.add_argument('--foods', required=True, help='Path to foods JSON array.')
    parser.add_argument('--out', default='python_ai/data/generated_plan.json', help='Output plan file path.')
    return parser.parse_args()


def load_profile(path: Path) -> UserProfile:
    payload = json.loads(path.read_text(encoding='utf-8'))
    return UserProfile(
        age=int(payload['age']),
        weight_kg=float(payload['weight_kg']),
        height_cm=float(payload['height_cm']),
        gender=str(payload['gender']),
        goal=str(payload['goal']),
        activity_level=str(payload['activity_level']),
        has_diabetes=int(payload['has_diabetes']),
        lactose_intolerant=int(payload['lactose_intolerant']),
        meals_per_day=int(payload['meals_per_day']),
        snacks_per_day=int(payload['snacks_per_day']),
        liked_foods=list(payload.get('liked_foods', [])),
        disliked_foods=list(payload.get('disliked_foods', [])),
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


def distance(a: dict[str, Any], b: dict[str, Any], numeric_stats: dict[str, dict[str, float]]) -> float:
    numeric_distance = 0.0
    for column in NUMERIC_COLUMNS:
        range_value = float(numeric_stats[column]['range'])
        delta = abs(float(a[column]) - float(b[column])) / range_value
        numeric_distance += delta

    categorical_distance = 0.0
    for column in CATEGORICAL_COLUMNS:
        if str(a[column]).lower() != str(b[column]).lower():
            categorical_distance += 1.0

    return numeric_distance + categorical_distance


def predict_macros(model: dict[str, Any], row: dict[str, Any], k: int = 7) -> dict[str, float]:
    train_rows = model['rows']
    numeric_stats = model['numeric_stats']

    if not train_rows:
        raise ValueError('Model has no training rows.')

    ranked = []
    for item in train_rows:
        dist = distance(row, item['features'], numeric_stats)
        ranked.append((dist, item['targets']))

    ranked.sort(key=lambda item: item[0])
    neighbors = ranked[: max(1, min(k, len(ranked)))]

    weighted_sums = {
        'target_calories': 0.0,
        'target_protein': 0.0,
        'target_carbs': 0.0,
        'target_fats': 0.0,
    }
    total_weight = 0.0

    for dist, targets in neighbors:
        weight = 1.0 / (dist + 1e-6)
        total_weight += weight
        for key in weighted_sums:
            weighted_sums[key] += float(targets[key]) * weight

    return {key: weighted_sums[key] / total_weight for key in weighted_sums}


def select_foods(foods: list[dict[str, Any]], profile: UserProfile) -> list[dict[str, Any]]:
    liked = set(profile.liked_foods)
    disliked = set(profile.disliked_foods)

    filtered = []
    for food in foods:
        name = str(food.get('name', ''))
        if name in disliked:
            continue
        if profile.lactose_intolerant and food.get('containsLactose'):
            continue
        if profile.has_diabetes and food.get('glycemicIndex') == 'High':
            continue
        filtered.append(food)

    filtered.sort(key=lambda item: (0 if str(item.get('name', '')) in liked else 1, str(item.get('name', ''))))
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
            'notes': ['No foods available after applying preferences.'],
        }

    items = []
    for index in range(total_slots):
        food = foods[index % len(foods)]
        items.append(
            {
                'slot': index + 1,
                'food': food['name'],
                'category': food.get('category', 'Unknown'),
                'target_macros': per_slot,
            }
        )

    return {
        'daily_targets': macros,
        'slot_targets': per_slot,
        'items': items,
        'notes': [
            'Plan respects liked/disliked food list.',
            'Lactose foods are removed when lactose_intolerant = 1.',
            'High-GI foods are removed when has_diabetes = 1.',
        ],
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

    predicted = predict_macros(model, feature_row(profile), k=7)
    macros = {
        'calories': max(1200, round(float(predicted['target_calories']))),
        'protein': max(80, round(float(predicted['target_protein']), 1)),
        'carbs': max(80, round(float(predicted['target_carbs']), 1)),
        'fats': max(30, round(float(predicted['target_fats']), 1)),
    }

    filtered_foods = select_foods(foods, profile)
    plan = build_plan(macros, filtered_foods, profile)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(plan, indent=2), encoding='utf-8')
    print(f'Plan generated: {out_path}')


if __name__ == '__main__':
    main()
