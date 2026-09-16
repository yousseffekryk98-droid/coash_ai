from __future__ import annotations

import sys
import unittest
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / 'src'
sys.path.insert(0, str(SRC))

from generate_plan import UserProfile, apply_guardrails, select_foods
from model_core import build_numeric_stats, evaluate_leave_one_out, validate_and_normalize_row


def row(**overrides):
    payload = {
        'age': 30,
        'weight_kg': 75,
        'height_cm': 175,
        'gender': 'male',
        'goal': 'maintenance',
        'activity_level': 'active',
        'has_diabetes': 0,
        'lactose_intolerant': 0,
        'meals_per_day': 4,
        'snacks_per_day': 1,
        'target_calories': 2500,
        'target_protein': 160,
        'target_carbs': 285,
        'target_fats': 80,
    }
    payload.update(overrides)
    return payload


class ModelValidationTests(unittest.TestCase):
    def test_valid_row_is_normalized(self):
        cleaned = validate_and_normalize_row(row(gender='MALE', goal='Maintenance'))
        self.assertEqual(cleaned['features']['gender'], 'male')
        self.assertEqual(cleaned['features']['goal'], 'maintenance')
        self.assertEqual(cleaned['targets']['target_calories'], 2500)

    def test_out_of_range_values_are_rejected(self):
        with self.assertRaises(ValueError):
            validate_and_normalize_row(row(age=7))

    def test_severely_inconsistent_macros_are_rejected(self):
        with self.assertRaises(ValueError):
            validate_and_normalize_row(row(target_calories=1200, target_protein=250, target_carbs=400, target_fats=120))

    def test_leave_one_out_returns_metrics(self):
        rows = [
            validate_and_normalize_row(row(age=24, weight_kg=65, target_calories=2200, target_protein=140, target_carbs=255, target_fats=68)),
            validate_and_normalize_row(row(age=30, weight_kg=75, target_calories=2500, target_protein=160, target_carbs=285, target_fats=80)),
            validate_and_normalize_row(row(age=38, weight_kg=88, target_calories=2850, target_protein=185, target_carbs=325, target_fats=90)),
            validate_and_normalize_row(row(age=42, weight_kg=95, target_calories=3000, target_protein=195, target_carbs=340, target_fats=95)),
        ]
        stats = build_numeric_stats(rows)
        metrics = evaluate_leave_one_out(rows, stats, 1)
        self.assertEqual(metrics['samples'], 4)
        self.assertIsNotNone(metrics['normalized_mae'])
        self.assertIn('target_calories', metrics['targets'])


class GenerationGuardrailTests(unittest.TestCase):
    def setUp(self):
        self.profile = UserProfile(
            age=30,
            weight_kg=75,
            height_cm=175,
            gender='male',
            goal='maintenance',
            activity_level='active',
            has_diabetes=1,
            lactose_intolerant=1,
            meals_per_day=4,
            snacks_per_day=1,
            liked_foods=['Chicken Breast'],
            disliked_foods=['Avocado'],
        )

    def test_guardrails_bound_extreme_predictions(self):
        guarded, notes = apply_guardrails(
            {
                'target_calories': 9000,
                'target_protein': 900,
                'target_carbs': 20,
                'target_fats': 500,
            },
            self.profile,
        )
        self.assertLessEqual(guarded['calories'], 5000)
        self.assertLessEqual(guarded['protein'], self.profile.weight_kg * 2.5)
        self.assertGreaterEqual(guarded['carbs'], 50)
        self.assertTrue(notes)

    def test_food_filters_respect_diabetes_and_lactose_flags(self):
        foods = [
            {'name': 'Chicken Breast', 'category': 'Protein', 'glycemicIndex': 'Low', 'containsLactose': False},
            {'name': 'Milk', 'category': 'Protein', 'glycemicIndex': 'Low', 'containsLactose': True},
            {'name': 'White Rice', 'category': 'Carb', 'glycemicIndex': 'High', 'containsLactose': False},
            {'name': 'Avocado', 'category': 'Fat', 'glycemicIndex': 'Low', 'containsLactose': False},
        ]
        selected = select_foods(foods, self.profile)
        self.assertEqual([item['name'] for item in selected], ['Chicken Breast'])


if __name__ == '__main__':
    unittest.main()
