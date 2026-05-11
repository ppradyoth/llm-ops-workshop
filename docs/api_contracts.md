# API Contracts

Base URL (production): `https://llm-ops-workshop-api.onrender.com`
Base URL (local): `http://localhost:8000`

---

## POST `/analyze`

Analyze a resume and return structured ATS feedback.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `resume_text` | string | One of text/file | min 80, max 20 000 chars |
| `resume_file` | file | One of text/file | PDF or TXT, max 5 MB |
| `target_role` | string | No | max 120 chars |
| `job_description` | string | No | max 8 000 chars |

Provide either `resume_text` or `resume_file` — not both.

**Success response (200)**

```json
{
  "ats_score": 82,
  "missing_skills": ["kubernetes", "terraform"],
  "strengths": ["docker", "ci/cd", "fastapi"],
  "recommendations": ["Add quantified impact to each bullet."],
  "engine": "gemini"
}
```

| Field | Type | Description |
|---|---|---|
| `ats_score` | integer 0–100 | ATS readiness score |
| `missing_skills` | string[] | Keywords missing for the target role |
| `strengths` | string[] | Resume strengths found |
| `recommendations` | string[] | Specific improvement actions |
| `engine` | `"gemini"` \| `"heuristic"` | Which service produced the result |

**Error responses**

| Status | Code | When |
|---|---|---|
| 400 | `bad_request` | Missing resume, both text+file provided, text too short |
| 400 | `guardrail_violation` | Prompt injection detected or text is not a resume |
| 422 | `request_validation_error` | Malformed form fields |
| 502 | `ai_service_error` | Gemini API call failed |
| 502 | `ai_output_error` | Gemini returned invalid JSON |
| 503 | `ai_configuration_error` | Gemini API key not configured |
| 504 | `ai_timeout` | Gemini request timed out |

All error responses share this shape:

```json
{
  "detail": "Human-readable message",
  "code": "machine_readable_code",
  "request_id": "uuid"
}
```

**Example**

```bash
curl -X POST https://llm-ops-workshop-api.onrender.com/analyze \
  -F "target_role=MLOps Engineer" \
  -F "resume_text=Senior MLOps Engineer with 5 years experience..."
```

---

## GET `/health`

```json
{
  "status": "ok",
  "environment": "production",
  "gemini_configured": true
}
```

---

## GET `/live`

Liveness probe — returns 200 if the process is running.

```json
{ "status": "alive" }
```

---

## GET `/ready`

Readiness probe — returns 200 when the app is ready to serve traffic.

```json
{ "status": "ready" }
```

---

## GET `/metrics`

In-memory operational metrics (reset on restart).

```json
{
  "total_requests": 123,
  "total_errors": 2,
  "average_latency_ms": 45.2,
  "requests_by_path": {
    "/analyze": 100,
    "/health": 23
  }
}
```
