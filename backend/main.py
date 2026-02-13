"""
CDVAE UI Platform — FastAPI Backend

Architecture: React Frontend → FastAPI Backend → CDVAE Model (inference.py)
Model is loaded once at startup, not inside endpoints.
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from inference import CDVAEModel
from runner import JobManager

# ─── App Setup ────────────────────────────────────────────────────────

app = FastAPI(title="CDVAE UI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure outputs and checkpoints directories exist
OUTPUTS_DIR = "outputs"
CHECKPOINTS_DIR = "checkpoints"
Path(OUTPUTS_DIR).mkdir(exist_ok=True)
Path(CHECKPOINTS_DIR).mkdir(exist_ok=True)
Path(OUTPUTS_DIR, "cif").mkdir(parents=True, exist_ok=True)

# Load model once at startup (not inside endpoints)
CHECKPOINT_PATH = os.path.join(CHECKPOINTS_DIR, "cdvae.ckpt")
model = CDVAEModel(checkpoint_path=CHECKPOINT_PATH)

manager = JobManager(outputs_dir=OUTPUTS_DIR, inference_model=model)

# ─── Request / Response Models ────────────────────────────────────────

class TrainRequest(BaseModel):
    dataset: str = "mp_20"
    epochs: int = Field(default=10, ge=1, le=500)
    batch_size: int = Field(default=32, ge=1, le=256)
    learning_rate: float = Field(default=0.001, gt=0, le=1)


class GenerateRequest(BaseModel):
    num_samples: int = Field(default=10, ge=1, le=500)
    temperature: float = Field(default=1.0, gt=0, le=5.0)


class GenerateSingleRequest(BaseModel):
    """Single crystal generation by composition (sync, no job)."""
    composition: str = "C"


class StopRequest(BaseModel):
    job_id: str

# ─── Routes ───────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "CDVAE UI API is running", "version": "1.0.0"}


@app.post("/train")
async def train(req: TrainRequest):
    job = await manager.start_training(
        dataset=req.dataset,
        epochs=req.epochs,
        batch_size=req.batch_size,
        learning_rate=req.learning_rate,
    )
    return {"job_id": job.id, "state": job.state.value}


@app.post("/train/stop")
def stop_training(req: StopRequest):
    success = manager.stop_training(req.job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or not running")
    return {"job_id": req.job_id, "state": "stopped"}


@app.post("/generate")
async def generate(req: GenerateRequest):
    """Batch generation: returns job_id, poll /status/{job_id} for progress."""
    job = await manager.start_generation(
        num_samples=req.num_samples,
        temperature=req.temperature,
    )
    return {"job_id": job.id, "state": job.state.value}


@app.post("/generate/single")
def generate_single(req: GenerateSingleRequest):
    """Single crystal generation: returns result immediately (no job)."""
    result = model.generate_crystal(composition=req.composition)
    return result


@app.get("/status")
def status():
    """Return status of most recent train and generate jobs."""
    result = {}

    if manager.train_jobs:
        latest = list(manager.train_jobs.values())[-1]
        result["train"] = latest.to_dict()

    if manager.generate_jobs:
        latest = list(manager.generate_jobs.values())[-1]
        result["generate"] = latest.to_dict()

    return result


@app.get("/status/{job_id}")
def job_status(job_id: str):
    job = manager.train_jobs.get(job_id) or manager.generate_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@app.get("/results")
def results():
    return manager.get_all_results()


@app.get("/files")
def list_files():
    return {"files": manager.list_cif_files()}


@app.get("/download/{filename}")
def download(filename: str):
    """Download generated CIF file from outputs/cif/."""
    filepath = os.path.join(manager.outputs_dir, "cif", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, filename=filename, media_type="chemical/x-cif")
