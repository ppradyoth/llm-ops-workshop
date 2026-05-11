# Troubleshooting

## Backend won't start

- Check `.env` exists and `GEMINI_API_KEY` is set (or leave blank with `ENABLE_AI_FALLBACK=true`)
- Check venv is active: `source backend/.venv/bin/activate`
- Check port 8000 isn't already in use: `lsof -i :8000`

## `400 guardrail_violation`

The request was blocked before reaching Gemini. Two possible causes:

**Topicality rail** — the resume text has fewer than 4 recognisable resume signal words. Fix: submit a proper resume (experience, skills, education keywords expected).

**Injection rail** — one of the input fields (`resume_text`, `target_role`, `job_description`) matched a prompt injection pattern. Fix: remove phrases like "ignore previous instructions", "you are now", "act as", etc.

Check logs for `guardrail_injection_blocked` or `guardrail_topicality_blocked` with the matched pattern.

## `400 bad_request` — resume too short

Minimum 80 characters. The sample resume pre-filled in the UI is always long enough.

## `502 ai_service_error` / `504 ai_timeout`

Gemini call failed after retries. If `ENABLE_AI_FALLBACK=true`, the heuristic service should have responded instead. Check:
- `gemini_configured: false` in `/health` means `GEMINI_API_KEY` is missing or empty
- Rate limit exceeded — Gemini free tier is 15 RPM / 1 500 req/day
- Render backend is cold-starting — first request after inactivity takes ~30s

## `503 ai_configuration_error`

`GEMINI_API_KEY` is not set and `ENABLE_AI_FALLBACK=false`. Either add the key or set `ENABLE_AI_FALLBACK=true`.

## Frontend shows "Could not reach the backend"

The `fetch` to the backend timed out or was refused. Common causes:

1. **Render cold start** — wait 30s and try again; the green dot in the header will appear when ready
2. **CORS** — check `CORS_ORIGINS` on the backend includes the frontend URL exactly
3. **Wrong API URL** — check `VITE_API_BASE_URL` in `frontend/.env` matches the backend URL

## Resume file upload fails

- Only PDF and TXT accepted
- Maximum 5 MB
- Don't provide both `resume_text` and `resume_file` simultaneously — the tab switcher in the UI prevents this, but direct API calls can hit it

## Metrics show high error rate

```bash
curl https://llm-ops-workshop-api.onrender.com/metrics
```

- High `total_errors` with low `total_requests` → likely Gemini errors; check `/health` for `gemini_configured`
- Low latency errors → likely guardrail violations (instant rejection, no AI call)
- High latency errors → likely Gemini timeouts; check `GEMINI_TIMEOUT_SECONDS`

## Trivy scan flags a vulnerability

Add the CVE ID to `.trivyignore` with a comment explaining why it's acceptable:

```
# .trivyignore
CVE-2023-12345  # dev-only dependency, not in production image
```

Then re-run the scan to confirm it's suppressed.

## Dark mode doesn't toggle

The theme is stored in `localStorage` under the key `theme`. To reset:

```js
// In browser console
localStorage.removeItem('theme')
location.reload()
```
