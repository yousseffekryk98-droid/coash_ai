# Free Local AI Diet Planner (Python)

This module adds a fully free, local AI workflow for diet targets and plan generation.
No paid API is required.
All file access is restricted to the `python_ai` folder.

## What it does

- Trains a model to predict daily calories and macros from user profile data.
- Generates a simple meal-slot plan based on:
  - liked foods
  - disliked foods
  - lactose intolerance
  - diabetes mode (filters high-GI foods)

## Install

```bash
pip install -r python_ai/requirements.txt
```

No paid APIs and no third-party ML packages are required.

## Train model

Use your own historical coaching data in CSV format.
You can start from the template:

- [python_ai/data/training_data_template.csv](python_ai/data/training_data_template.csv)

Train:

```bash
python python_ai/src/train_model.py \
  --data python_ai/data/training_data_template.csv \
  --out python_ai/models/diet_planner.json
```

## Generate a plan

Use:

- user profile JSON: [python_ai/data/sample_profile.json](python_ai/data/sample_profile.json)
- foods JSON: [python_ai/data/sample_foods.json](python_ai/data/sample_foods.json)

```bash
python python_ai/src/generate_plan.py \
  --model python_ai/models/diet_planner.json \
  --profile python_ai/data/sample_profile.json \
  --foods python_ai/data/sample_foods.json \
  --out python_ai/data/generated_plan.json
```

## Data you should provide for better training

For each real client/phase row, include:

- age
- weight_kg
- height_cm
- gender
- goal (fat_loss, lean_bulk, maintenance, competition_prep)
- activity_level (inactive, lightly_active, active, very_active)
- has_diabetes (0/1)
- lactose_intolerant (0/1)
- meals_per_day
- snacks_per_day
- target_calories
- target_protein
- target_carbs
- target_fats

The more real rows you provide, the better the model becomes.

## Notes

- This is a coaching assistant, not a medical diagnosis tool.
- For production quality, add validation, outlier checks, and periodic retraining.
- The scripts will raise `PermissionError` if a path points outside `python_ai`.
