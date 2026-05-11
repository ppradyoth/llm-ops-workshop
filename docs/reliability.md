# Reliability Engineering

## Philosophy

Reliability is achieved through layered defence: input validation → guardrails → AI retry/timeout → fallback → structured output validation. Each layer is independent and testable. The system degrades gracefully rather than failing hard.

## Layers in Order

```
1. Pydantic validation    — rejects malformed input before any processing
2. GuardrailService       — rejects injections and off-topic input (zero tokens)
3. GeminiResumeService    — retry + timeout + structured output enforcement
4. HeuristicResumeService — local fallback, no external calls
5. AnalyzeResponse        — Pydantic validates output before it leaves the backend
```

## Guardrails

The `GuardrailService` is the first reliability gate for AI calls. By running before Gemini, it:
- Prevents malicious or garbage input from consuming API tokens
- Provides instant rejection (no network call) for obvious attacks
- Keeps logs clean — matched patterns are logged without the full input

See `docs/security.md` for the full list of patterns.

## Retry Logic

`retry_async` in `utils/retry.py` wraps Gemini calls with:
- **Configurable attempts** (`GEMINI_RETRY_ATTEMPTS`, default 3)
- **Exponential backoff** — delay doubles each attempt: `base * 2^(attempt-1)`
- **Jitter** — ±0.25s random offset prevents thundering herd
- **Max delay cap** — 8 seconds maximum between attempts
- **Selective retry** — only retries `AIServiceError` and `AITimeoutError`; does not retry `AIConfigurationError` or `AIOutputError`

## Timeout

Each Gemini call is wrapped with `asyncio.wait_for(timeout=GEMINI_TIMEOUT_SECONDS)` (default 30s). A `TimeoutError` is converted to `AITimeoutError` and triggers the retry logic.

## Fallback

`ENABLE_AI_FALLBACK` controls whether `HeuristicResumeService` is used when Gemini fails:
- `true` (default in dev/CI) — always falls back, returns `engine: "heuristic"`
- `false` (production) — surfaces the error so it is visible and alertable

The `engine` field in every response makes fallback observable to the frontend and in logs.

## Error Handling

All exceptions flow to global handlers in `main.py`:

| Handler | Catches | HTTP |
|---|---|---|
| `app_error_handler` | `AppError` and subclasses | 400–504 |
| `validation_error_handler` | `RequestValidationError` | 422 |
| `unhandled_error_handler` | Everything else | 500 |

Every error response includes `request_id` for log correlation. Stack traces and internal details are never exposed to clients.

## Observability

- `/health` — environment name + `gemini_configured` flag
- `/live` — liveness probe (process is running)
- `/ready` — readiness probe (app is serving)
- `/metrics` — in-memory: `total_requests`, `total_errors`, `average_latency_ms`, `requests_by_path`

Metrics reset on restart (in-memory). For persistent monitoring, scrape `/metrics` into Prometheus or forward logs to an external service.

## Testing

15 tests cover the full reliability surface:

```bash
pytest tests/test_guardrails.py   # 9 tests — injection + topicality rails
pytest tests/test_analyze.py      # 2 tests — happy path + short resume rejection
pytest tests/test_gemini_service.py  # 2 tests — structured output + malformed JSON
pytest tests/test_health.py       # 2 tests — health + liveness/readiness
```
