# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Resume Analyzer — fullstack app that accepts a resume (PDF/TXT/text) and target role, runs rule-based guardrails, calls Gemini for structured ATS scoring, and returns `{ ats_score, missing_skills, strengths, recommendations, engine }`. Heuristic fallback works without a Gemini key (used in CI and local demos).

## Commands

### Backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run tests:
```bash
pytest                              # all tests
pytest tests/test_guardrails.py -v  # guardrail tests only
pytest tests/test_analyze.py -v     # analyze endpoint tests
```

### Frontend

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
npm run build                              # production build
```

### Docker

```bash
docker compose up --build backend
```

### Deploy

```bash
# Frontend to Render (auto on push, or manual build + deploy)
cd frontend && npm run build
# Push to GitHub → Render auto-deploys both services
```

### Environment setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
# Set GEMINI_API_KEY in .env for live AI
# Leave ENABLE_AI_FALLBACK=true for local demos without a key
```

## Architecture

```
Request → FastAPI (routers/analyze.py)
            → ResumeAnalyzerService (services/resume_service.py)
                → _resolve_resume_text (utils/pdf.py)
                → Pydantic validation (schemas/resume.py: AnalyzePayload)
                → GuardrailService (services/guardrail_service.py)
                     → injection_rail (15 regex patterns, all input fields)
                     → topicality_rail (≥4 resume signal words)
                     → raises GuardrailError (400) on violation
                → GeminiResumeService (services/gemini_service.py)
                     → retry_async (utils/retry.py, exponential backoff + jitter)
                     → Gemini API with response_json_schema enforcement
                [on failure or no key]
                → HeuristicResumeService (services/heuristic_service.py)
            → AnalyzeResponse (Pydantic, validated on way out, includes engine field)
       MonitoringMiddleware → metrics singleton (services/monitoring_service.py)
```

## Key Architectural Rules

- **GuardrailService runs before every AI call** — never skip it. Zero tokens consumed.
- **Strict schema at both ends** — `AnalyzePayload` validates inputs; `AnalyzeResponse.model_validate_json()` validates Gemini output; `ANALYSIS_JSON_SCHEMA` constrains Gemini at the API level.
- **`engine` field is always set** — `"gemini"` by `GeminiResumeService`, `"heuristic"` by `HeuristicResumeService`.
- **All config via `get_settings()`** — never read env vars directly in routes or services.
- **New endpoints** → router in `app/routers/`, service in `app/services/`, schemas in `app/schemas/`, wired into `app/main.py`.
- **Error types** in `app/utils/exceptions.py` — use the appropriate subclass; global handlers in `main.py` convert to consistent JSON with `request_id`.
- **Monitoring** is in-memory only — `metrics` singleton in `monitoring_service.py`, recorded by `monitoring_middleware`. Resets on restart.

## Frontend

Single-page React app. Components: `Logo`, `ThemeToggle`, `AnalysisForm` (tab-based text/file input), `ResultPanel` (loading skeleton, empty state, score ring, list blocks), `HealthBadge`, `ErrorBanner`, `ErrorBoundary`. API calls in `frontend/src/lib/api.js`. Backend URL via `VITE_API_BASE_URL`.

Dark mode: Tailwind `class` strategy, toggled on `<html>`, stored in `localStorage`, respects `prefers-color-scheme` on first visit.

## Deployment

- **Backend**: Docker → Render, health check on `/health`, defined in `render.yaml`
- **Frontend**: Static Vite build → Render static site, SPA rewrite to `/index.html`, defined in `render.yaml`
- **Both auto-deploy** on push to `main`
- **CI**: `.github/workflows/ci.yml` — manual trigger only (reference file for workshop)

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Required for live AI; omit for heuristic fallback |
| `ENABLE_AI_FALLBACK` | `true` | Fall back to heuristics when Gemini fails |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `ENVIRONMENT` | `development` | Surfaced in `/health` |
| `MAX_RESUME_CHARS` | `20000` | Resume text truncated to this before AI call |
| `MAX_UPLOAD_MB` | `5` | Max file upload size |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL for frontend |
