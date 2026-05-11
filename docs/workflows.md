# Operational Workflows

## Local Development

```bash
# 1. Clone and set up environment
git clone https://github.com/ppradyoth/llm-ops-workshop.git
cd llm-ops-workshop
cp .env.example .env
cp frontend/.env.example frontend/.env

# 2. Start backend
cd backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 3. Start frontend (new terminal)
cd frontend && npm install && npm run dev
```

Or with Docker:
```bash
docker compose up --build backend
```

## Testing

```bash
cd backend && source .venv/bin/activate

pytest                              # all 15 tests
pytest tests/test_guardrails.py -v  # guardrail tests only
pytest tests/test_analyze.py -v     # analyze endpoint tests
```

## Security Scanning

```bash
# Install Trivy (macOS)
brew install aquasecurity/trivy/trivy

# Full scan (filesystem + image)
./scripts/scan.sh

# Quick filesystem scan only
trivy fs . --scanners vuln,secret,misconfig --severity HIGH,CRITICAL
```

## Deployment

Both services auto-deploy on every push to `main` via Render:

- **Backend** (Docker): `https://llm-ops-workshop-api.onrender.com`
- **Frontend** (Static): `https://llm-ops-workshop.onrender.com`

To trigger manually from Render dashboard: **Manual Deploy → Deploy latest commit**.

## CI Reference

`.github/workflows/ci.yml` defines four jobs: `backend`, `frontend`, `trivy-fs`, `trivy-image`. Currently set to `workflow_dispatch` (manual only). To enable automatic runs on push, update the `on:` trigger in the workflow file.

## Monitoring

```bash
# Live health + Gemini status
curl https://llm-ops-workshop-api.onrender.com/health

# Request counts, error rate, average latency
curl https://llm-ops-workshop-api.onrender.com/metrics
```

## Failure Recovery

- If Gemini API fails: system falls back to heuristic analysis (`ENABLE_AI_FALLBACK=true`)
- Guardrail violations return `400 guardrail_violation` immediately — no AI call made
- All errors logged with `request_id` for tracing
