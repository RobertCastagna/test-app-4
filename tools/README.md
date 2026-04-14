# Training & Export Pipeline

Python workflow that produces `assets/models/mlp.pte` — the tabular home-win classifier that ships with the app. This directory is **not** bundled with the mobile app.

## Setup

```bash
cd tools
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python fetch_training_data.py      # writes data/train.parquet
python train_mlp.py                # writes checkpoints/mlp.pt + training_report.json
python export_to_executorch.py     # writes ../assets/models/mlp.pte
```

Then bump `MLP_VERSION` in `src/constants/model.ts` to match the checkpoint ID in `training_report.json`.

## Parity gate (critical)

The TypeScript `src/services/featureEngineering.ts` and Python `fetch_training_data.py` must produce **byte-identical** feature vectors for the same raw inputs. Five golden fixtures live in `tests/unit/featureEngineering.golden.json` — regenerate them here when feature logic changes:

```bash
python generate_golden_fixtures.py > ../tests/unit/featureEngineering.golden.json
```

Then run `npm test` in the repo root to confirm parity. Skipping this step is how the model silently breaks in production.

## Data sources

- `nba_api` (unofficial) for game logs + box scores, 2019–20 through 2023–24 regular seasons
- Expect transient rate-limit hiccups; script retries with backoff

## Outputs

| File | Size | Committed |
|---|---|---|
| `data/train.parquet` | ~50 MB | No (gitignored) |
| `checkpoints/mlp.pt` | ~200 KB | No |
| `../assets/models/mlp.pte` | ~100 KB | Yes |
| `../tests/unit/featureEngineering.golden.json` | ~5 KB | Yes |
