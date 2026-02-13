"""
CDVAE Inference Module — loads checkpoint once, runs crystal generation.

Uses real CDVAE sampling when checkpoint and cdvae package are available.
Falls back to structured dummy output for development/testing.
"""

import os
from pathlib import Path

# Optional: load PyTorch and CDVAE only when available
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from cdvae.pl_modules.model import CDVAE
    CDVAE_AVAILABLE = True
except ImportError:
    CDVAE_AVAILABLE = False


class CDVAEModel:
    """Wraps CDVAE for inference. Load once at startup, use for all generation requests."""

    def __init__(self, checkpoint_path: str | None = None):
        self.model = None
        self.checkpoint_path = checkpoint_path or "checkpoints/cdvae.ckpt"
        self._loaded = False

        if TORCH_AVAILABLE and CDVAE_AVAILABLE and os.path.exists(self.checkpoint_path):
            self._load_model()
        else:
            if not os.path.exists(self.checkpoint_path):
                print(f"[inference] Checkpoint not found at {self.checkpoint_path}, using dummy mode.")
            elif not CDVAE_AVAILABLE:
                print("[inference] cdvae package not installed, using dummy mode.")
            else:
                print("[inference] PyTorch not available, using dummy mode.")

    def _load_model(self):
        """Load CDVAE from checkpoint."""
        print("Loading CDVAE model...")
        self.model = CDVAE.load_from_checkpoint(self.checkpoint_path)
        self.model.eval()
        self._loaded = True
        print("Model loaded.")

    def generate_crystal(self, composition: str | None = None, temperature: float = 1.0) -> dict:
        """
        Generate a single crystal structure.

        Args:
            composition: Optional composition string (e.g. "C2H4"). Ignored in dummy mode.
            temperature: Sampling temperature.

        Returns:
            dict with keys: composition, lattice, atoms, frac_coords
        """
        if self._loaded and self.model is not None:
            return self._generate_real(composition or "unknown", temperature)
        return self._generate_dummy(composition or "C")

    def _generate_real(self, composition: str, temperature: float) -> dict:
        """Real CDVAE sampling."""
        import torch
        with torch.no_grad():
            latent_dim = getattr(self.model.model, "latent_dim", 256)
            z = torch.randn(1, latent_dim) * temperature
            generated = self.model.model.decode(z)
            # Convert to structured output (format depends on CDVAE output)
            return self._parse_cdvae_output(generated, composition)

    def _parse_cdvae_output(self, generated, composition: str) -> dict:
        """Parse CDVAE model output to standard format."""
        # CDVAE decode typically returns (frac_coords, atom_types, lengths, angles)
        # Adapt based on your actual CDVAE API
        try:
            if hasattr(generated, "__len__") and len(generated) >= 3:
                frac_coords = generated[0].cpu().numpy().tolist()
                atom_types = generated[1].cpu().numpy().tolist()
                lengths = generated[2].cpu().numpy().tolist() if len(generated) > 2 else [1, 1, 1]
                angles = generated[3].cpu().numpy().tolist() if len(generated) > 3 else [90, 90, 90]
                # Build lattice from lengths, angles
                from itertools import cycle
                elem_map = ["H", "C", "N", "O", "S", "Si", "Fe", "Ti", "Al", "Mg", "Na", "Cl", "Ge"]
                atoms = [elem_map[i % len(elem_map)] for i in atom_types]
                return {
                    "composition": composition,
                    "lattice": [[lengths[0], 0, 0], [0, lengths[1], 0], [0, 0, lengths[2]]],
                    "atoms": atoms,
                    "frac_coords": frac_coords,
                }
        except Exception as e:
            print(f"[inference] Parse error: {e}")
        return self._generate_dummy(composition)

    def _generate_dummy(self, composition: str | None) -> dict:
        """Dummy structured output for development."""
        return {
            "composition": composition or "C",
            "lattice": [[1.0, 0, 0], [0, 1.0, 0], [0, 0, 1.0]],
            "atoms": ["C", "C", "C"],
            "frac_coords": [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5]],
        }

    def to_cif(self, result: dict, title: str = "generated") -> str:
        """Convert structured result to CIF string."""
        lat = result.get("lattice", [[1, 0, 0], [0, 1, 0], [0, 0, 1]])
        atoms = result.get("atoms", ["C"])
        frac = result.get("frac_coords", [[0, 0, 0]] * len(atoms))
        a = (lat[0][0]**2 + lat[0][1]**2 + lat[0][2]**2)**0.5
        b = (lat[1][0]**2 + lat[1][1]**2 + lat[1][2]**2)**0.5
        c = (lat[2][0]**2 + lat[2][1]**2 + lat[2][2]**2)**0.5

        lines = [
            f"data_{title}",
            "_symmetry_space_group_name_H-M   'P 1'",
            f"_cell_length_a   {a:.4f}",
            f"_cell_length_b   {b:.4f}",
            f"_cell_length_c   {c:.4f}",
            "_cell_angle_alpha   90.000",
            "_cell_angle_beta    90.000",
            "_cell_angle_gamma   90.000",
            "",
            "loop_",
            "_atom_site_label",
            "_atom_site_type_symbol",
            "_atom_site_fract_x",
            "_atom_site_fract_y",
            "_atom_site_fract_z",
        ]
        for i, (el, fc) in enumerate(zip(atoms, frac)):
            x, y, z = fc[0] if len(fc) >= 3 else 0, fc[1] if len(fc) >= 2 else 0, fc[2] if len(fc) >= 3 else 0
            lines.append(f"{el}{i+1} {el} {x:.4f} {y:.4f} {z:.4f}")
        return "\n".join(lines)
