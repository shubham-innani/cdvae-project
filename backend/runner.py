"""
CDVAE Job Manager — manages background training and generation jobs.

In production, this would shell out to real CDVAE scripts via subprocess.
For the UI scaffold, it simulates job lifecycle so the frontend can be
fully developed and tested.
"""

import asyncio
import time
import uuid
import math
import random
import os
import json
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


@dataclass
class TrainJob:
    id: str
    dataset: str
    epochs: int
    batch_size: int
    learning_rate: float = 0.001
    state: JobState = JobState.QUEUED
    current_epoch: int = 0
    loss: float = 0.0
    loss_history: list = field(default_factory=list)
    logs: list = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None

    def to_dict(self):
        d = asdict(self)
        d["state"] = self.state.value
        return d


@dataclass
class GenerateJob:
    id: str
    num_samples: int
    temperature: float = 1.0
    state: JobState = JobState.QUEUED
    generated_files: list = field(default_factory=list)
    logs: list = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None

    def to_dict(self):
        d = asdict(self)
        d["state"] = self.state.value
        return d


# ─── Singleton Manager ────────────────────────────────────────────────

class JobManager:
    def __init__(self, outputs_dir: str = "outputs", inference_model=None):
        self.train_jobs: dict[str, TrainJob] = {}
        self.generate_jobs: dict[str, GenerateJob] = {}
        self.outputs_dir = outputs_dir
        self.inference_model = inference_model  # CDVAEModel instance for generation
        os.makedirs(outputs_dir, exist_ok=True)
        os.makedirs(os.path.join(outputs_dir, "cif"), exist_ok=True)
        os.makedirs(os.path.join(outputs_dir, "checkpoints"), exist_ok=True)

    # ── Training ──────────────────────────────────────────────────────

    async def start_training(self, dataset: str, epochs: int,
                             batch_size: int, learning_rate: float = 0.001) -> TrainJob:
        job = TrainJob(
            id=str(uuid.uuid4())[:8],
            dataset=dataset,
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
        )
        self.train_jobs[job.id] = job
        asyncio.create_task(self._simulate_training(job))
        return job

    async def _simulate_training(self, job: TrainJob):
        """Simulates training epochs with decreasing loss."""
        job.state = JobState.RUNNING
        job.logs.append(f"[INFO] Training started on dataset '{job.dataset}'")
        job.logs.append(f"[INFO] Config: epochs={job.epochs}, batch_size={job.batch_size}, lr={job.learning_rate}")

        initial_loss = 2.5 + random.random()
        for epoch in range(1, job.epochs + 1):
            if job.state == JobState.STOPPED:
                job.logs.append(f"[WARN] Training stopped by user at epoch {epoch}")
                return

            await asyncio.sleep(1.5)  # simulate compute time

            progress = epoch / job.epochs
            noise = random.uniform(-0.05, 0.05)
            loss = initial_loss * math.exp(-2.5 * progress) + noise
            loss = max(loss, 0.01)

            job.current_epoch = epoch
            job.loss = round(loss, 4)
            job.loss_history.append({"epoch": epoch, "loss": job.loss})
            job.logs.append(f"[EPOCH {epoch}/{job.epochs}] loss={job.loss:.4f}")

        job.state = JobState.COMPLETED
        job.completed_at = time.time()
        job.logs.append("[INFO] Training completed successfully.")

    def stop_training(self, job_id: str) -> bool:
        job = self.train_jobs.get(job_id)
        if job and job.state == JobState.RUNNING:
            job.state = JobState.STOPPED
            return True
        return False

    # ── Generation ────────────────────────────────────────────────────

    async def start_generation(self, num_samples: int,
                               temperature: float = 1.0) -> GenerateJob:
        job = GenerateJob(
            id=str(uuid.uuid4())[:8],
            num_samples=num_samples,
            temperature=temperature,
        )
        self.generate_jobs[job.id] = job
        asyncio.create_task(self._simulate_generation(job))
        return job

    async def _simulate_generation(self, job: GenerateJob):
        """Generate crystals using inference model (or demo CIF if no model)."""
        job.state = JobState.RUNNING
        job.logs.append(f"[INFO] Generation started: {job.num_samples} samples, temp={job.temperature}")

        for i in range(1, job.num_samples + 1):
            await asyncio.sleep(0.3)  # Brief delay between samples

            filename = f"crystal_{job.id}_{i:03d}.cif"
            filepath = os.path.join(self.outputs_dir, "cif", filename)

            if self.inference_model:
                result = self.inference_model.generate_crystal(
                    composition=f"sample_{i}",
                    temperature=job.temperature,
                )
                cif_content = self.inference_model.to_cif(result, title=f"crystal_{job.id}_{i:03d}")
            else:
                cif_content = self._make_demo_cif(i)

            with open(filepath, "w") as f:
                f.write(cif_content)

            job.generated_files.append(filename)
            job.logs.append(f"[GEN {i}/{job.num_samples}] {filename}")

        job.state = JobState.COMPLETED
        job.completed_at = time.time()
        job.logs.append("[INFO] Generation completed successfully.")

    @staticmethod
    def _make_demo_cif(index: int) -> str:
        """Create a minimal demo CIF file for a simple crystal structure."""
        a = round(3.5 + random.random() * 2, 4)
        b = round(3.5 + random.random() * 2, 4)
        c = round(3.5 + random.random() * 2, 4)
        elements = ["Si", "Ge", "C", "Na", "Cl", "Ti", "O", "Fe", "Al", "Mg"]
        el = random.choice(elements)

        return f"""data_crystal_{index}
_symmetry_space_group_name_H-M   'P 1'
_cell_length_a   {a}
_cell_length_b   {b}
_cell_length_c   {c}
_cell_angle_alpha   90.000
_cell_angle_beta    90.000
_cell_angle_gamma   90.000

loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
{el}1 {el} 0.0000 0.0000 0.0000
{el}2 {el} 0.5000 0.5000 0.0000
{el}3 {el} 0.5000 0.0000 0.5000
{el}4 {el} 0.0000 0.5000 0.5000
"""

    # ── Queries ───────────────────────────────────────────────────────

    def get_all_results(self) -> dict:
        return {
            "train_jobs": [j.to_dict() for j in self.train_jobs.values()],
            "generate_jobs": [j.to_dict() for j in self.generate_jobs.values()],
        }

    def list_cif_files(self) -> list[str]:
        cif_dir = os.path.join(self.outputs_dir, "cif")
        if not os.path.exists(cif_dir):
            return []
        return sorted(f for f in os.listdir(cif_dir) if f.endswith(".cif"))
