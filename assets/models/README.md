# Bundled models

## `mlp.pte`

ExecuTorch tabular classifier that takes a 26-feature input and emits a single logit (home-win logit). Used by `src/hooks/useTabularModel.ts`.

**The file currently in this directory is a 1-byte placeholder** so Metro bundling succeeds. Before the app can run meaningful predictions, replace it with a real model exported from `tools/export_to_executorch.py`:

```bash
cd tools
python -m venv .venv && source .venv/bin/activate    # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python fetch_training_data.py       # pulls 5 NBA seasons into tools/data/train.parquet
python train_mlp.py                 # writes tools/checkpoints/mlp.pt + training_report.json
python export_to_executorch.py      # writes this assets/models/mlp.pte
```

Expect ~100 KB final size with XNNPACK quantization. Bump `MLP_VERSION` in `src/constants/model.ts` whenever you retrain.

## LLM model (not in repo)

The Llama 3.2 1B SpinQuant `.pte` is **not** committed. It is downloaded at first run by `react-native-executorch` via the `LLAMA3_2_1B_SPINQUANT` pre-built constant (~1.1 GB, Wi-Fi recommended). Storage lands under the library's managed cache in the app's documents directory. Users can purge via Settings.
