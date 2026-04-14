"""Export tools/checkpoints/mlp.pt -> ../assets/models/mlp.pte (ExecuTorch).

Uses XNNPACK partitioner for CPU-only, quantized-friendly backend. The .pte
lands at assets/models/mlp.pte and is bundled in the iOS app via
require('@assets/models/mlp.pte').
"""
from __future__ import annotations

from pathlib import Path

import torch
from executorch.exir import to_edge_transform_and_lower
from executorch.backends.xnnpack.partition.xnnpack_partitioner import (
    XnnpackPartitioner,
)

from train_mlp import MLP

ROOT = Path(__file__).parent
CKPT = ROOT / "checkpoints" / "mlp.pt"
OUT = (ROOT.parent / "assets" / "models" / "mlp.pte").resolve()


def main() -> None:
    model = MLP()
    model.load_state_dict(torch.load(CKPT, map_location="cpu"))
    model.eval()

    example = (torch.randn(1, 26),)
    with torch.no_grad():
        ep = torch.export.export(model, example)
    edge = to_edge_transform_and_lower(ep, partitioner=[XnnpackPartitioner()])
    program = edge.to_executorch()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(program.buffer)

    size_kb = OUT.stat().st_size / 1024
    print(f"Exported {OUT} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
