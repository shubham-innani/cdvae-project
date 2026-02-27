"""
Energy prediction model integrated from model.ipynb.

This wraps the notebook logic into a reusable trainer that:
- Parses CIF strings from a CSV dataset with pymatgen
- Builds simple numeric features
- Trains a small MLP (EnergyPredictor) with PyTorch

It is OPTIONAL: if required libraries or dataset are missing, the backend
falls back to the existing synthetic training simulation so the UI still works.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Generator, Tuple

# Optional heavy dependencies (torch / sklearn / pymatgen / pandas)
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    from pymatgen.core import Structure

    LIBS_AVAILABLE = True
except ImportError:
    # One or more optional libs are missing; we will run in "disabled" mode.
    LIBS_AVAILABLE = False


class EnergyPredictor(nn.Module):  # type: ignore[misc]
    def __init__(self) -> None:
        super().__init__()

        self.model = nn.Sequential(
            nn.Linear(8, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x):  # type: ignore[override]
        return self.model(x)


class EnergyTrainer:
    """
    Thin wrapper around the notebook pipeline.

    Usage:
      trainer = EnergyTrainer(dataset_path="datasets/train.csv")
      if trainer.available:
          for epoch, loss in trainer.train_epochs(epochs=200, batch_size=32, learning_rate=1e-3):
              ...
    """

    def __init__(self, dataset_path: str | Path = "datasets/train.csv") -> None:
        self.dataset_path = Path(dataset_path)
        self.available: bool = bool(LIBS_AVAILABLE and self.dataset_path.exists())

        self._loaded = False
        self._X_tensor = None
        self._y_tensor = None
        self._scaler = None
        self._model: EnergyPredictor | None = None
        self._criterion = None
        self._optimizer = None

    # ── Internal helpers ────────────────────────────────────────────────

    def _load_dataset(self) -> None:
        if self._loaded or not self.available:
            return

        # Mirror the feature extraction from the notebook.
        df = pd.read_csv(self.dataset_path)

        cif_column = [col for col in df.columns if "cif" in col.lower()][0]

        features = []
        targets = []

        for i in range(len(df)):
            cif_string = df[cif_column][i]
            try:
                structure = Structure.from_str(cif_string, fmt="cif")

                num_atoms = len(structure)
                volume = structure.volume
                a, b, c = structure.lattice.abc
                alpha, beta, gamma = structure.lattice.angles

                features.append([num_atoms, volume, a, b, c, alpha, beta, gamma])
                targets.append(df["energy_per_atom"][i])
            except Exception:
                # Skip problematic structures to keep pipeline robust.
                continue

        if not features or not targets:
            # Nothing usable in dataset.
            self.available = False
            return

        import numpy as np

        X = np.array(features)
        y = np.array(targets)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        X_tensor = torch.tensor(X_scaled, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).view(-1, 1)

        self._X_tensor = X_tensor
        self._y_tensor = y_tensor
        self._scaler = scaler

        model = EnergyPredictor()
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        self._model = model
        self._criterion = criterion
        self._optimizer = optimizer
        self._loaded = True

    # ── Public API ──────────────────────────────────────────────────────

    def train_epochs(
        self,
        epochs: int,
        batch_size: int,
        learning_rate: float,
    ) -> Generator[Tuple[int, float], None, None]:
        """
        Generator yielding (epoch, loss) pairs.

        If libraries or dataset are not available, yields a synthetic
        exponentially decaying loss curve for the requested number of epochs.
        """
        if not self.available:
            # Fallback: deterministic synthetic curve so UI stays functional.
            initial_loss = 2.5
            for epoch in range(1, epochs + 1):
                progress = epoch / max(epochs, 1)
                noise = 0.02 * math.sin(epoch / 3)
                loss = max(initial_loss * math.exp(-2.5 * progress) + noise, 0.01)
                yield epoch, float(round(loss, 4))
            return

        self._load_dataset()
        if not self._loaded or self._model is None:
            # Dataset failed to load; fall back to synthetic curve.
            yield from self.train_epochs(epochs, batch_size, learning_rate)
            return

        # Update LR if requested.
        for g in self._optimizer.param_groups:  # type: ignore[union-attr]
            g["lr"] = learning_rate

        X_tensor = self._X_tensor
        y_tensor = self._y_tensor
        model = self._model
        criterion = self._criterion
        optimizer = self._optimizer

        assert X_tensor is not None and y_tensor is not None

        for epoch in range(1, epochs + 1):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss_tensor = criterion(outputs, y_tensor)
            loss_tensor.backward()
            optimizer.step()

            loss_value = float(loss_tensor.item())
            yield epoch, round(loss_value, 4)

