## CDVAE UI (React) + FastAPI Backend

This repo implements a simple, clean architecture:

React Frontend → FastAPI Backend → (Python model execution) → Output files (CIF / metrics) → JSON → Frontend visualization.

### What’s included

- **Frontend** (`frontend/`)
  - React + Vite + Tailwind UI
  - Pages: Dashboard, Train, Generate, Results, Visualize (3D CIF viewer)
  - All API calls go through `frontend/src/api.js`
- **Backend** (`backend/`)
  - FastAPI server exposing endpoints used by the UI
  - Background job manager for long-running training/generation (non-blocking)
  - Output CIF files written under `backend/outputs/cif/`
  - Optional “real” CDVAE inference if `cdvae` + checkpoint are installed; otherwise runs in dummy mode

---

### Run locally (recommended)

#### 1) Start the backend (FastAPI)

From repo root:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`.

#### 2) Start the frontend (Vite)

In a second terminal from repo root:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

The frontend is configured to call `/api/*`, and Vite proxies that to `http://localhost:8000/*` (see `frontend/vite.config.js`).

---

### Backend API (used by the frontend)

- **Training**
  - `POST /train` → `{ job_id, state }`
  - `POST /train/stop` → `{ job_id, state }`
- **Generation**
  - `POST /generate` → `{ job_id, state }`
  - `POST /generate/single` → sync generation (returns a single structure JSON)
- **Job status**
  - `GET /status/{job_id}` → job JSON (state, logs, progress fields, etc.)
  - `GET /status` → latest train + generate job
- **Results / files**
  - `GET /results` → `{ train_jobs: [...], generate_jobs: [...] }`
  - `GET /files` → `{ files: ["...cif", ...] }`
  - `GET /download/{filename}` → CIF file download (text)
- **Datasets**
  - `POST /upload` (multipart form, key `file`) → saves into `backend/datasets/`
  - `GET /datasets` → lists uploaded dataset files

---

### Notes

- **CORS**: set `CDVAE_ALLOWED_ORIGINS` to a comma-separated list for production. Default is `*`.
- **Production**: Vite proxy is dev-only. For production, serve the frontend and reverse-proxy `/api` to the backend (Nginx/Caddy), or configure the frontend to use an absolute API base URL.

