# Backend Design

## Overview

The backend is a FastAPI application with a layered pipeline: HTTP → validation → guardrails → AI → structured response. Each layer is a separate service class with a single responsibility.

## Service Layer

| Service | File | Purpose |
|---|---|---|
| `ResumeAnalyzerService` | `services/resume_service.py` | Pipeline coordinator |
| `GuardrailService` | `services/guardrail_service.py` | Rule-based input safety |
| `GeminiResumeService` | `services/gemini_service.py` | Gemini API integration |
| `HeuristicResumeService` | `services/heuristic_service.py` | Local fallback analysis |
| `MonitoringService` | `services/monitoring_service.py` | In-memory metrics |

## Request Pipeline

```
POST /analyze
  │
  ├─ RequestContextMiddleware   → attach request_id to request.state
  ├─ MonitoringMiddleware       → record latency + HTTP status on response
  │
  └─ ResumeAnalyzerService.analyze()
       │
       ├─ 1. _resolve_resume_text()
       │      - rejects if both resume_text AND resume_file provided
       │      - extracts text from PDF/TXT upload via pypdf
       │
       ├─ 2. _validate_payload()
       │      - Pydantic AnalyzePayload: min 80 chars, max 20 000 chars
       │      - strips whitespace from all fields
       │      - truncates resume_text to MAX_RESUME_CHARS
       │
       ├─ 3. GuardrailService.check()
       │      - injection_rail: regex scan of all three fields
       │      - topicality_rail: requires ≥4 resume signal words
       │      - raises GuardrailError (400) if either rail fails
       │
       ├─ 4a. GeminiResumeService.analyze()    (if GEMINI_API_KEY is set)
       │       - builds prompt with role + job description context
       │       - calls Gemini with response_json_schema enforcement
       │       - asyncio.wait_for timeout (GEMINI_TIMEOUT_SECONDS)
       │       - retry_async: exponential backoff + jitter on AIServiceError/AITimeoutError
       │       - parses response via AnalyzeResponse.model_validate_json()
       │       - sets engine="gemini"
       │
       └─ 4b. HeuristicResumeService.analyze() (fallback)
               - keyword matching against TECH_SKILLS set
               - scoring formula: base 45 + skill matches + impact words + length
               - sets engine="heuristic"
```

## Guardrail Service

`GuardrailService` runs **before** any Gemini call — zero tokens consumed.

**Injection rail** — 15 compiled regex patterns covering:
- `ignore previous/all instructions`
- `you are now`, `act as`, `pretend to be`
- `forget everything`, `override instructions`
- Role injection (`system:`, `[system]`, `<|im_start|>`)
- Token injection and jailbreak keywords (`DAN`, `jailbreak`, `do anything now`)

Applied to: `resume_text`, `job_description`, and `target_role`.

**Topicality rail** — checks `resume_text` for ≥4 words from a 70+ word signal set covering resume structure, employment, education, seniority, action verbs, and common tech keywords. Returns `GuardrailError` (400, `guardrail_violation`) if fewer than 4 signals are found.

## Error Hierarchy

```
AppError (base, 400)
├── BadRequestError          400  bad_request
├── GuardrailError           400  guardrail_violation
├── AIServiceError           502  ai_service_error
├── AIConfigurationError     503  ai_configuration_error
├── AIOutputError            502  ai_output_error
└── AITimeoutError           504  ai_timeout
```

All `AppError` subclasses are caught by the global handler in `main.py` and returned as:

```json
{
  "detail": "human-readable message",
  "code": "machine-readable code",
  "request_id": "uuid"
}
```

## Configuration

All config lives in `app/config.py` (pydantic-settings, `get_settings()` with `lru_cache`).

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Required for live AI |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Per-request timeout |
| `GEMINI_RETRY_ATTEMPTS` | `3` | Max retry attempts |
| `GEMINI_RETRY_BASE_DELAY_SECONDS` | `1.0` | Base delay for exponential backoff |
| `ENABLE_AI_FALLBACK` | `true` | Fall back to heuristics on failure |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `MAX_RESUME_CHARS` | `20000` | Resume text truncation limit |
| `MAX_UPLOAD_MB` | `5` | File upload size limit |

## Adding a New Endpoint

1. Create `app/routers/my_feature.py` with an `APIRouter`
2. Create `app/services/my_feature_service.py` with business logic
3. Add Pydantic schemas in `app/schemas/my_feature.py`
4. Wire the router into `app/main.py` via `app.include_router()`
5. Add tests in `backend/tests/test_my_feature.py`

## Security

**Secrets** — all secrets are environment variables. `.env` is gitignored and never committed. `GEMINI_API_KEY` lives only on the backend; Render secrets use `sync: false` so they are never written to `render.yaml`.

**CORS** — `CORS_ORIGINS` is a comma-separated list of allowed origins. Set to `http://localhost:5173` locally, the Render frontend URL in production.

**Logging** — structured JSON logs include `request_id`, path, and status. Resume text and personal data are never written to logs.

**No persistent storage** — no user data (resumes, results, PII) is stored on disk or in a database. All processing is stateless and in-memory per request.

**Error responses** — never expose stack traces, internal paths, raw third-party exceptions, or secrets. Every error includes `request_id` for log correlation.
