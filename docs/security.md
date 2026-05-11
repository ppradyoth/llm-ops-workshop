# Security & Guardrails

## Guardrail Layer

The `GuardrailService` is the primary defence against prompt manipulation. It runs after Pydantic validation and before any Gemini call, consuming zero tokens.

### Injection Rail

Scans all three user-controlled fields (`resume_text`, `job_description`, `target_role`) against 15 compiled regex patterns:

| Pattern category | Examples caught |
|---|---|
| Instruction override | `ignore previous instructions`, `disregard all instructions` |
| Identity hijack | `you are now`, `act as`, `pretend to be`, `from now on you are` |
| Memory wipe | `forget everything`, `forget all instructions` |
| Role injection | `system:`, `[system]`, `<\|im_start\|>` |
| Jailbreak keywords | `jailbreak`, `DAN`, `do anything now` |
| New instruction injection | `new instructions:`, `override your rules` |

Returns `400 guardrail_violation` on any match. The matched pattern is logged (without the full input text) for monitoring.

### Topicality Rail

Checks `resume_text` for a minimum of 4 words from a 70+ word signal set covering resume structure, employment, education, seniority levels, action verbs, and common technical terms. Rejects inputs that don't resemble a professional resume.

### Limits of Rule-Based Guardrails

Rule-based guardrails can be bypassed by an attacker who knows the patterns. This is intentional and teachable — see `WORKSHOP.md` for the bypass demonstration. In production, stack a rule-based layer (fast, zero cost) with an LLM-based layer (NeMo Guardrails or similar) for defence in depth.

## Input Validation

- **Pydantic schemas** enforce type, length, and format before guardrails run
- **Resume text**: min 80 chars, max 20 000 chars
- **Job description**: max 8 000 chars
- **Target role**: max 120 chars
- **File uploads**: PDF and TXT only, max 5 MB, content extracted via pypdf

## Secrets Management

- All secrets loaded from environment variables — never hardcoded
- `.env` is in `.gitignore` and never committed
- `GEMINI_API_KEY` is only present on the backend; never sent to the frontend
- Render secrets are set as `sync: false` (not stored in `render.yaml`)

## CORS

`CORS_ORIGINS` is a comma-separated list of allowed origins. Set explicitly for each environment:
- Local dev: `http://localhost:5173`
- Production: the Render frontend URL

## Container Security

- Backend container runs as non-root by default
- Only required packages are installed (`requirements.txt`)
- No shell or debug tools included in the production image

## Error Responses

Errors never expose:
- Stack traces
- Internal file paths
- Raw exception messages from third-party libraries
- The Gemini API key or any secret

Every error response includes a `request_id` for log correlation without leaking implementation details.

## No Persistent Storage

No user data (resumes, results, PII) is stored on disk or in a database. All processing is stateless and in-memory per request.

## Logging

Structured JSON logs include `request_id`, path, and status. Resume text and personal data are never written to logs.
