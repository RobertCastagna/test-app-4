"""Train the 26-feature -> home_won MLP.

Reads data/train.parquet, writes checkpoints/mlp.pt + training_report.json.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, TensorDataset

FEATURE_COUNT = 26
ROOT = Path(__file__).parent
DATA = ROOT / "data" / "train.parquet"
CKPT_DIR = ROOT / "checkpoints"
REPORT = ROOT / "training_report.json"

TRAIN_SEASONS = ["2019-20", "2020-21", "2021-22"]
VAL_SEASONS = ["2022-23"]
TEST_SEASONS = ["2023-24"]

EPOCHS = 50
BATCH = 128
LR = 1e-3
WD = 1e-4
PATIENCE = 5


class MLP(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(FEATURE_COUNT, 64), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(32, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def _season_of(date: str) -> str:
    year, month, _ = date.split("-")
    y = int(year)
    if int(month) >= 10:
        return f"{y}-{str(y + 1)[2:]}"
    return f"{y - 1}-{str(y)[2:]}"


def _split(df: pd.DataFrame, seasons: list[str]) -> tuple[np.ndarray, np.ndarray]:
    mask = df["date"].apply(_season_of).isin(seasons)
    sub = df[mask]
    xs = sub[[f"f{i}" for i in range(FEATURE_COUNT)]].to_numpy(dtype=np.float32)
    ys = sub["label"].to_numpy(dtype=np.float32)
    return xs, ys


def _brier(probs: np.ndarray, labels: np.ndarray) -> float:
    return float(np.mean((probs - labels) ** 2))


def _logloss(probs: np.ndarray, labels: np.ndarray, eps: float = 1e-7) -> float:
    p = np.clip(probs, eps, 1 - eps)
    return float(-np.mean(labels * np.log(p) + (1 - labels) * np.log(1 - p)))


def main() -> None:
    CKPT_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_parquet(DATA)

    x_tr, y_tr = _split(df, TRAIN_SEASONS)
    x_va, y_va = _split(df, VAL_SEASONS)
    x_te, y_te = _split(df, TEST_SEASONS)

    tr_ds = TensorDataset(torch.from_numpy(x_tr), torch.from_numpy(y_tr))
    tr_loader = DataLoader(tr_ds, batch_size=BATCH, shuffle=True)

    model = MLP()
    opt = optim.AdamW(model.parameters(), lr=LR, weight_decay=WD)
    bce = nn.BCEWithLogitsLoss()

    best_val = float("inf")
    best_state = None
    patience_left = PATIENCE

    for epoch in range(EPOCHS):
        model.train()
        for xb, yb in tr_loader:
            opt.zero_grad()
            logits = model(xb).squeeze(-1)
            loss = bce(logits, yb)
            loss.backward()
            opt.step()

        model.eval()
        with torch.no_grad():
            val_logits = model(torch.from_numpy(x_va)).squeeze(-1).numpy()
            val_probs = 1 / (1 + np.exp(-val_logits))
            val_brier = _brier(val_probs, y_va)
        print(f"epoch {epoch}: val_brier={val_brier:.4f}")

        if val_brier < best_val - 1e-4:
            best_val = val_brier
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_left = PATIENCE
        else:
            patience_left -= 1
            if patience_left <= 0:
                print(f"early stop @ epoch {epoch}")
                break

    assert best_state is not None
    model.load_state_dict(best_state)
    torch.save(model.state_dict(), CKPT_DIR / "mlp.pt")

    with torch.no_grad():
        te_logits = model(torch.from_numpy(x_te)).squeeze(-1).numpy()
        te_probs = 1 / (1 + np.exp(-te_logits))
    report = {
        "checkpoint": "checkpoints/mlp.pt",
        "feature_count": FEATURE_COUNT,
        "train_rows": int(len(y_tr)),
        "val_rows": int(len(y_va)),
        "test_rows": int(len(y_te)),
        "test_accuracy": float(np.mean((te_probs > 0.5) == y_te.astype(bool))),
        "test_brier": _brier(te_probs, y_te),
        "test_logloss": _logloss(te_probs, y_te),
        "version": "mlp-v0.1",
    }
    REPORT.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
