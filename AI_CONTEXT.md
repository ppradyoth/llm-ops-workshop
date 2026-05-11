# AI_CONTEXT.md

Canonical condensed context for AI agents working in this repository.

---

## Project Purpose

Production-grade AI Resume Analyzer & Career Assistant. Demonstrates reliable AI orchestration, guardrails, validation, monitoring, and deployment for MLOps/AI system design workshops.

## Architecture Summary

- **Frontend**: React 19, Vite, TailwindCSS — dark/light mode, tab-based input, loading skeleton
- **Backend**: FastAPI (Python 3.11) — layered pipeline: validation → guardrails → AI → response
- **Guardrail Layer**: Rule-based `GuardrailService` — injection rail + topicality rail, zero tokens
- **AI Layer**: Gemini 2.5 Flash — structured output enforced by `response_json_schema` + Pydantic
- **Fallback**: `HeuristicResumeService` — local keyword scoring, no external calls
- **Containerization**: Docker, docker-compose
- **Deployment**: Both backend (Docker) and frontend (static) auto-deploy to Render on push to main

## Request Pipeline

```
Input → Pydantic validation → GuardrailService → GeminiResumeService (or HeuristicResumeService) → AnalyzeResponse
```

GuardrailService runs BEFORE any Gemini call. Zero tokens consumed by guardrail checks.

## Key API Contracts

- **POST `/analyze`**: multipart/form-data — `resume_text` or `resume_file`, `target_role`, `job_description`
- **Response**: `{ ats_score, missing_skills, strengths, recommendations, engine }`
- **engine field**: `"gemini"` | `"heuristic"` — always present in every response
- **GET `/health`**: `{ status, environment, gemini_configured }`
- **GET `/metrics`**: `{ total_requests, total_errors, average_latency_ms, requests_by_path }`

## Error Codes

| Code | Status | Meaning |
|---|---|---|
| `bad_request` | 400 | Invalid input |
| `guardrail_violation` | 400 | Injection detected or not a resume |
| `ai_service_error` | 502 | Gemini API failure |
| `ai_output_error` | 502 | Gemini returned bad JSON |
| `ai_configuration_error` | 503 | No API key |
| `ai_timeout` | 504 | Gemini timed out |

## Deployment

- Backend: `https://llm-ops-workshop-api.onrender.com` (Docker, Render)
- Frontend: `https://llm-ops-workshop.onrender.com` (Static, Render)
- Both defined in `render.yaml`, auto-deploy on push to `main`

## Engineering Rules

- Never bypass Pydantic schema validation
- GuardrailService must run before every AI call
- All config via environment variables — no hardcoded secrets
- All new endpoints require request + response Pydantic models
- `engine` field must be set by every service that returns `AnalyzeResponse`
- Logs must never contain resume text, PII, or API keys
