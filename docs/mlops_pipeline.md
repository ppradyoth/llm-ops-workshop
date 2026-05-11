# MLOps Pipeline — Step by Step

How every MLOps practice in this project fits together, from a code change to a deployed, observable, versioned service.

---

## The Big Picture

```
Developer writes code
  → Tests pass locally
  → Push to GitHub
      → Render auto-deploys (continuous delivery)
      → CI workflow available for reference
  → Tag a release
      → Docker image built and pushed to GHCR
      → Any environment can pull and run a pinned version
  → Users submit resumes
      → Request flows through 5 reliability layers
      → Metrics accumulate in /metrics
      → Logs emit structured JSON
```

Every step below corresponds to a concrete file or endpoint in this repo.

---

## Step 1 — Define the Contract (Schemas)

**File:** `backend/app/schemas/resume.py`

Before writing any logic, define what valid input and output look like. Pydantic v2 enforces these at runtime.

```python
class AnalyzePayload(BaseModel):
    resume_text: str | None  # min 80 chars after strip
    target_role: str | None
    job_description: str | None

class AnalyzeResponse(BaseModel):
    ats_score: int            # 0–100
    missing_skills: list[str]
    strengths: list[str]
    recommendations: list[str]
    engine: Literal["gemini", "heuristic"]
```

`ANALYSIS_JSON_SCHEMA` (also in this file) is passed directly to the Gemini API so the model is constrained to produce output that matches `AnalyzeResponse`. Schema enforcement happens at both ends.

**MLOps principle:** Define your data contract first. Validation at input prevents garbage from reaching expensive compute. Validation at output guarantees downstream consumers can parse the response.

---

## Step 2 — Centralise Configuration

**File:** `backend/app/config.py`

All environment variables are read once, in one place, via `pydantic-settings`. Services call `get_settings()` — they never touch `os.environ` directly.

```python
class Settings(BaseSettings):
    app_version: str = "1.0.0"
    gemini_api_key: str | None = Field(default=None, validation_alias="GEMINI_API_KEY")
    enable_ai_fallback: bool = Field(default=True, validation_alias="ENABLE_AI_FALLBACK")
    gemini_retry_attempts: int = Field(default=3, ...)
    ...
```

`@lru_cache` on `get_settings()` means Settings is parsed once per process and reused.

**MLOps principle:** Externalise config. The same Docker image runs in dev (`.env` file), CI (environment variables), and production (Render dashboard secrets) without any code changes.

---

## Step 3 — Guard the Input (Guardrails)

**File:** `backend/app/services/guardrail_service.py`

The guardrail layer runs **before any AI call**, consuming zero tokens. It has two rails:

**Injection rail** — 15 compiled regex patterns covering:
- Instruction override phrases (`ignore.*previous.*instructions`)
- Identity hijacking (`you are now`, `act as`)
- Jailbreak keywords (`DAN mode`, `developer mode`, `no restrictions`)

**Topicality rail** — counts resume signal words from a 70-word frozenset (job titles, skills, education keywords, action verbs). Fewer than 4 matches → rejected.

```python
class GuardrailService:
    def check(self, payload: AnalyzePayload) -> None:
        self._injection_rail(payload.resume_text, field="resume_text")
        if payload.job_description:
            self._injection_rail(payload.job_description, field="job_description")
        if payload.target_role:
            self._injection_rail(payload.target_role, field="target_role")
        self._topicality_rail(payload.resume_text)
```

A violation raises `GuardrailError` (HTTP 400, code `guardrail_violation`). The error is returned instantly with no AI call made.

**MLOps principle:** Protect expensive resources with cheap pre-filters. Rule-based guardrails are fast, deterministic, and free. They catch obvious attacks; LLM-based semantic checks (e.g. NeMo Guardrails) catch subtle ones — layer them in production.

---

## Step 4 — Call the AI with Retry and Timeout

**File:** `backend/app/services/gemini_service.py`  
**File:** `backend/app/utils/retry.py`

Gemini is called with two reliability wrappers:

**Timeout** — `asyncio.wait_for(timeout=GEMINI_TIMEOUT_SECONDS)` (default 30s). A `TimeoutError` becomes `AITimeoutError`.

**Retry** — `retry_async` decorator with exponential backoff + jitter:
- Up to 3 attempts (configurable)
- Delay doubles each attempt: `base * 2^(attempt-1)`
- ±0.25s random jitter prevents thundering herd
- Max 8s between retries
- Only retries `AIServiceError` and `AITimeoutError` — not config errors or bad output

**Structured output** — `response_json_schema=ANALYSIS_JSON_SCHEMA` is passed to the Gemini API. Gemini is constrained to return valid JSON matching the schema. The response is validated again with `AnalyzeResponse.model_validate_json()` before it leaves the service.

**MLOps principle:** External API calls will fail. Design for it: timeout so you don't hang forever, retry transient errors with backoff, validate outputs because models can still produce unexpected structures.

---

## Step 5 — Fallback Gracefully

**File:** `backend/app/services/heuristic_service.py`

When Gemini is unavailable (no API key, rate limited, timed out after retries), `HeuristicResumeService` runs locally:

- Tokenises the resume text
- Scores against a keyword list for the target role
- Computes an ATS score and generates missing skills / strengths / recommendations from keyword presence

Returns a valid `AnalyzeResponse` with `engine: "heuristic"`. The frontend shows a grey "Local fallback" badge.

`ENABLE_AI_FALLBACK=true` (default in dev/CI) enables this. Set `false` in production to make Gemini failures visible and alertable rather than silently degraded.

**MLOps principle:** Graceful degradation keeps the service useful when dependencies fail. The `engine` field makes the degraded state observable rather than hidden.

---

## Step 6 — Observe the System

**File:** `backend/app/routers/health.py`  
**File:** `backend/app/services/monitoring_service.py`

Four endpoints expose system state:

| Endpoint | Purpose | What it returns |
|---|---|---|
| `GET /health` | General status | `status`, `version`, `environment`, `gemini_configured` |
| `GET /live` | Liveness probe | Same as `/health` — is the process running? |
| `GET /ready` | Readiness probe | Adds `checks` dict — is the app ready to serve traffic? |
| `GET /metrics` | Request metrics | `total_requests`, `total_errors`, `average_latency_ms`, `requests_by_path` |

`MonitoringMiddleware` records every request's path, status code, and latency into the `metrics` singleton. The singleton is in-memory and resets on restart — suitable for local observability; replace with Prometheus client for persistent monitoring.

The `version` field in `/health` matches `app_version` in `config.py` and the Docker image tag — so you can always tell what version is running.

**MLOps principle:** You can't improve what you can't measure. Health endpoints enable load balancer checks, deployment verification, and alerting. Metrics give you error rate and latency without external tooling.

---

## Step 7 — Test the Reliability Surface

**Directory:** `backend/tests/`

15 tests covering every reliability layer:

| File | Tests | What's covered |
|---|---|---|
| `test_guardrails.py` | 9 | Topicality rail, injection rail in all 3 input fields |
| `test_analyze.py` | 2 | Happy path, short resume rejection |
| `test_gemini_service.py` | 2 | Structured output parsing, malformed JSON handling |
| `test_health.py` | 2 | `/health` response shape, `/live` + `/ready` probes |

Run all tests:
```bash
cd backend && pytest -v
```

Run a single file:
```bash
pytest tests/test_guardrails.py -v
```

**MLOps principle:** Test the pipeline layers independently. Guardrail tests don't need Gemini. Gemini service tests mock the API client. Each layer is testable in isolation, making failures easy to locate.

---

## Step 8 — Scan for Security Issues

**File:** `.github/workflows/ci.yml` (jobs: `trivy-fs`, `trivy-image`)  
**File:** `scripts/scan.sh`

Trivy scans three surfaces:

**Filesystem scan** — checks Python and npm dependencies for CVEs, scans all committed files for accidentally hardcoded secrets (API keys, tokens, passwords), and checks `Dockerfile` for misconfigurations.

```bash
trivy fs . --scanners vuln,secret,misconfig --severity HIGH,CRITICAL
```

**Docker image scan** — checks OS packages inside the built image (not just application dependencies).

```bash
docker build -t ai-resume-analyzer-api:scan ./backend
trivy image ai-resume-analyzer-api:scan --scanners vuln --severity HIGH,CRITICAL
```

Both scans exit with code 1 on any HIGH or CRITICAL finding — they would fail a CI pipeline. Known false positives are suppressed in `.trivyignore`.

**MLOps principle:** Security scanning belongs in the pipeline, not as a one-off manual check. Catching a CVE before it reaches production is orders of magnitude cheaper than responding to an incident.

---

## Step 9 — Deploy Continuously

**File:** `render.yaml`

Both services are defined in `render.yaml` and auto-deploy on every push to `main`:

```
git push origin main
  │
  ├─► Backend (Docker web service on Render)
  │     docker build ./backend → health check /health → swap traffic
  │
  └─► Frontend (static site on Render)
        npm install && npm run build → publish dist/ → CDN
```

The backend health check (`/health`) must return 200 before Render swaps traffic to the new deployment. If the build or health check fails, the previous version stays live.

Zero-downtime by default: Render runs the new container alongside the old one until the health check passes.

**MLOps principle:** Every push to main should be deployable. Automated deployment removes the manual step that causes configuration drift between what's tested and what's running.

---

## Step 10 — Version and Publish Artifacts

**File:** `.github/workflows/docker-publish.yml`  
**File:** `backend/app/config.py` (`app_version`)

When a named release is ready:

```bash
# 1. Update app_version in config.py to match the new tag
# 2. Commit and push
git push origin main

# 3. Tag the release
git tag v1.1.0 && git push origin v1.1.0

# 4. Create the GitHub Release — this triggers docker-publish.yml
gh release create v1.1.0 --title "v1.1.0" --notes "..."
```

`docker-publish.yml` then:
1. Logs in to GHCR using `GITHUB_TOKEN` (no secret to manage)
2. Extracts version tags from the Git tag via `docker/metadata-action`
3. Builds `./backend` and pushes with three tags:
   - `ghcr.io/ppradyoth/llm-ops-workshop/api:1.1.0`
   - `ghcr.io/ppradyoth/llm-ops-workshop/api:1.1`
   - `ghcr.io/ppradyoth/llm-ops-workshop/api:sha-<commit>`

The `version` field in every `/health` response ties the running service back to the artifact:

```bash
curl https://llm-ops-workshop-api.onrender.com/health
# {"status":"ok","version":"1.0.0","environment":"production","gemini_configured":true}
```

Pull and run any historical version:
```bash
docker pull ghcr.io/ppradyoth/llm-ops-workshop/api:1.0.0
docker run -p 8000:8000 -e ENABLE_AI_FALLBACK=true ghcr.io/ppradyoth/llm-ops-workshop/api:1.0.0
```

**MLOps principle:** Artifacts, not source code, are what you deploy. A versioned, immutable Docker image in a registry means any environment (staging, production, a colleague's laptop) can run exactly the same binary that passed your tests. Semantic versioning + the `version` field in the API make the running version inspectable without SSH access.

---

## Full Pipeline at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│  DEVELOP                                                        │
│  Schema first (Pydantic) → Config externalised → Tests written │
└──────────────────────────────┬──────────────────────────────────┘
                               │ git push
┌──────────────────────────────▼──────────────────────────────────┐
│  SECURE                                                         │
│  Trivy fs scan: CVE + secret + misconfig                        │
│  Trivy image scan: OS packages in Docker image                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ push to main
┌──────────────────────────────▼──────────────────────────────────┐
│  DEPLOY (continuous)                                            │
│  Render: Docker build → /health check → swap traffic            │
│  Frontend: npm build → CDN publish                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ gh release create vX.Y.Z
┌──────────────────────────────▼──────────────────────────────────┐
│  RELEASE (on demand)                                            │
│  docker-publish.yml → build → push to GHCR                     │
│  ghcr.io/.../api:X.Y.Z — pinned, immutable, pullable anywhere  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ user request
┌──────────────────────────────▼──────────────────────────────────┐
│  SERVE (5 reliability layers per request)                       │
│  1. Pydantic input validation                                   │
│  2. GuardrailService (0 tokens, instant)                        │
│  3. GeminiResumeService (retry + timeout + structured output)   │
│  4. HeuristicResumeService (fallback)                           │
│  5. Pydantic output validation                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  OBSERVE                                                        │
│  /health → version, environment, gemini_configured             │
│  /metrics → request count, error rate, latency                  │
│  Structured JSON logs → request_id correlation                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files by MLOps Concern

| MLOps concern | Files |
|---|---|
| Schema / contract | `backend/app/schemas/resume.py`, `backend/app/schemas/health.py` |
| Configuration | `backend/app/config.py`, `.env.example`, `render.yaml` |
| Guardrails | `backend/app/services/guardrail_service.py` |
| AI orchestration | `backend/app/services/gemini_service.py`, `backend/app/utils/retry.py` |
| Fallback | `backend/app/services/heuristic_service.py` |
| Observability | `backend/app/routers/health.py`, `backend/app/services/monitoring_service.py` |
| Request tracing | `backend/app/middleware/request_context.py`, `backend/app/utils/logging.py` |
| Testing | `backend/tests/` |
| Security scanning | `.github/workflows/ci.yml`, `scripts/scan.sh`, `.trivyignore` |
| Continuous deployment | `render.yaml` |
| Artifact publishing | `.github/workflows/docker-publish.yml` |
| Versioning | `backend/app/config.py` (`app_version`), Git tags, GHCR image tags |
