# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Resume Analyzer — a fullstack app that accepts a resume (PDF/TXT/text) and target role, calls the Gemini API for structured ATS scoring, and returns `{ ats_score, missing_skills, strengths, recommendations }`. The AI layer has a heuristic fallback so the app works without a Gemini key (used in CI and local demos).

## Commands

### Backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run tests (from `backend/` with venv active):
```bash
pytest                          # all tests
pytest tests/test_analyze.py    # single file
```

Or from the repo root (no venv needed if installed globally):
```bash
npm run backend:test
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
npm run build
```

### Docker

```bash
docker compose up --build backend   # backend only at :8000
```

### Environment setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Set `GEMINI_API_KEY` in `.env` for live AI; leave `ENABLE_AI_FALLBACK=true` to use heuristics instead.

## Architecture

```
Request → FastAPI (routers/analyze.py)
            → ResumeAnalyzerService (services/resume_service.py)
                → input extraction (utils/pdf.py)
                → Pydantic validation (schemas/resume.py: AnalyzePayload)
                → GeminiResumeService (services/gemini_service.py)
                     → retry_async (utils/retry.py, exponential backoff + jitter)
                     → Gemini API with response_json_schema enforcement
                [on failure or no key]
                → HeuristicResumeService (services/heuristic_service.py)
            → AnalyzeResponse (Pydantic, validated on the way out)
       monitoring_middleware → metrics singleton (services/monitoring_service.py)
```

### Key architectural rules

- **Strict schema enforcement everywhere.** `AnalyzePayload` validates inputs before any AI call. `AnalyzeResponse` validates Gemini output via `model_validate_json`. `ANALYSIS_JSON_SCHEMA` is passed to Gemini's `response_json_schema` to constrain generation at the API level.
- **Fallback is controlled by `ENABLE_AI_FALLBACK`.** In production (`render.yaml`) it is `false` so Gemini failures surface as errors. In CI and local dev it defaults to `true`.
- **All config lives in `app/config.py` (`Settings`).** Access via `get_settings()` (lru_cache). Never read env vars directly in route or service code.
- **New endpoints** require a router in `app/routers/`, a service in `app/services/`, and Pydantic schemas in `app/schemas/`. Wire the router into `app/main.py`.
- **Error types** (`AppError`, `BadRequestError`, `AIServiceError`, etc.) are in `app/utils/exceptions.py`. The global handlers in `main.py` convert them to consistent JSON with `request_id`.
- **Monitoring** is in-memory only — `metrics` singleton in `monitoring_service.py`, recorded by `monitoring_middleware` in `main.py`. Not persistent across restarts.

### Frontend

Single-page React app (`frontend/src/App.jsx`). Components: `AnalysisForm`, `ResultPanel`, `HealthBadge`, `ErrorBanner`, `ErrorBoundary`. API calls are in `frontend/src/lib/api.js`. Backend URL is set via `VITE_API_BASE_URL`.

## Deployment

- **Backend**: Dockerized, deployed to Render via `render.yaml`. Health check on `/health`.
- **Frontend**: Static Vite build, deployed to Firebase Hosting (`frontend/firebase.json`). Set `VITE_API_BASE_URL` to the Render URL before `npm run build`.
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs `pytest` (backend) and `npm run build` (frontend) on every push/PR to `main`. Tests run with `ENABLE_AI_FALLBACK=true`.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Required for live AI; omit to use heuristic fallback |
| `ENABLE_AI_FALLBACK` | `true` | Fall back to heuristics when Gemini fails or is unconfigured |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `ENVIRONMENT` | `development` | Surfaced in `/health` response |
| `MAX_RESUME_CHARS` | `20000` | Resume text is truncated to this before AI call |
| `MAX_UPLOAD_MB` | `5` | Max file upload size |
