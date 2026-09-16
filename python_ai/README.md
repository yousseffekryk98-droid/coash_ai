# Free Local AI Diet Planner (Python)

This module provides a fully local coaching-assistant workflow for diet-target prediction and plan generation. No paid API is required and the current implementation uses only the Python standard library.

The V2 pipeline is intentionally conservative: it validates training rows, evaluates candidate KNN configurations, records error metrics, reports out-of-distribution inputs, applies planning guardrails, and marks low-confidence/high-context plans for coach review.

## What it does

- Validates and normalizes training data before it can enter the model.
- Rejects unsupported ranges, missing fields, severe calorie/macro inconsistencies, and duplicate rows.
- Trains a weighted KNN regressor for daily calorie and macro targets.
- Uses leave-one-out cross-validation to select `k` from the configured candidates.
- Saves per-target MAE/MAPE metrics and a separate evaluation report.
- Generates plan suggestions from liked/disliked foods, lactose settings, and diabetes filtering.
- Reports neighbor distance, training-distribution coverage, prediction confidence, and whether coach review is required.
- Applies bounded calorie/protein/fat guardrails and reconciles carbohydrate energy with the guarded calorie target.

## Install

```bash
pip install -r python_ai/requirements.txt
```

No third-party ML package is required.

## Train and evaluate

Use real, de-identified, coach-reviewed historical data in CSV format. The included file is a template for pipeline testing only:

- `python_ai/data/training_data_template.csv`

Train:

```bash
python python_ai/src/train_model.py \
  --data python_ai/data/training_data_template.csv \
  --out python_ai/models/diet_planner.json \
  --report python_ai/models/diet_planner_report.json
```

The trainer evaluates valid K values from `1,3,5,7,9` by default and stores the best leave-one-out result. You can override them with `--k-candidates`.

## Generate a plan

```bash
python python_ai/src/generate_plan.py \
  --model python_ai/models/diet_planner.json \
  --profile python_ai/data/sample_profile.json \
  --foods python_ai/data/sample_foods.json \
  --out python_ai/data/generated_plan.json
```

The generated JSON includes:

- guarded daily targets
- meal-slot targets and food suggestions
- raw model prediction
- model/evaluation metadata
- neighbor-distance summary
- out-of-distribution fields
- confidence score
- explicit coach-review requirement and reasons

## Run tests

```bash
python -m unittest discover -s python_ai/tests -p "test_*.py"
```

The main GitHub Actions workflow runs these tests before frontend lint/build.

## Training fields

Each real coaching phase should include:

- age
- weight_kg
- height_cm
- gender
- goal (`fat_loss`, `lean_bulk`, `maintenance`, `competition_prep`)
- activity_level (`inactive`, `lightly_active`, `active`, `very_active`)
- has_diabetes (0/1)
- lactose_intolerant (0/1)
- meals_per_day
- snacks_per_day
- target_calories
- target_protein
- target_carbs
- target_fats

## What “better training” means here

More rows alone are not enough. Prefer high-quality examples where the target plan was actually reviewed by a coach and the outcome is known. The web app V2 migration adds structured `ai_recommendations` and `ai_recommendation_feedback` records so future training datasets can distinguish approved/helpful suggestions from rejected or unsafe ones.

The bundled six-row CSV must **not** be treated as production training data. The trainer emits warnings for small datasets, and the generator keeps confidence low when the training set is small or the input profile is outside the observed distribution.

## Safety and scope

- This module is coaching decision support, not diagnosis or treatment software.
- Diabetes and competition-prep contexts automatically require coach review.
- Do not train on identifiable health records without a documented lawful basis, access controls, retention policy, and consent/authorization appropriate to your deployment.
- Do not automatically apply plan changes to a client from model output. Keep the coach approval step.
- All CLI file access remains restricted to the `python_ai` directory.
