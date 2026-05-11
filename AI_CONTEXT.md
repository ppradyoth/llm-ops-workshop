# AI_CONTEXT.md

---

## Project Purpose
Production-grade AI Resume Analyzer & Career Assistant. Demonstrates reliable AI orchestration, validation, monitoring, and deployment for MLOps/AI system design.

## Architecture Summary
- **Frontend**: React (Vite, TailwindCSS)
- **Backend**: FastAPI (Python 3.11)
- **AI Layer**: Gemini API (structured output, fallback to heuristics)
- **Containerization**: Docker, docker-compose
- **Deployment**: Backend (Render), Frontend (Firebase Hosting)

## Component Boundaries
- **Frontend**: UI, form validation, error display, health status, API calls
- **Backend**: API endpoints, validation, AI orchestration, fallback, monitoring, error handling
- **AI Layer**: Gemini API integration, schema enforcement, fallback logic
- **Monitoring**: In-memory metrics, `/metrics` endpoint

## Key Workflows
1. User submits resume (text/file), target role, job description
2. Backend validates input, extracts text if needed
3. AI analysis via Gemini (timeout/retry); fallback to heuristics if needed
4. Structured JSON response returned
5. Metrics and logs recorded for every request

## Deployment Model
- **Backend**: Dockerized, deployed via Render (`render.yaml`), health checks on `/health`
- **Frontend**: Static build, deployed to Firebase Hosting (`firebase.json`)
- **Local**: `docker-compose.yml` for unified dev
- **Secrets**: Managed via environment variables (`.env`)

## API Contracts Summary
- **POST `/analyze`**: multipart/form-data, fields: `resume_text` or `resume_file`, `target_role`, `job_description`. Returns JSON: `{ ats_score, missing_skills, strengths, recommendations }`
- **GET `/health`**: `{ status, environment, gemini_configured }`
- **GET `/metrics`**: `{ total_requests, total_errors, average_latency_ms, requests_by_path }`

## Reliability Assumptions
- Strict schema validation (Pydantic) for all input/output
- Timeout/retry for AI calls
- Fallback to local analysis if Gemini fails
- Centralized error handling, structured logging
- Health/metrics endpoints for observability

## Security Constraints
- Input validation/sanitization for all user data
- Only PDF/TXT files accepted, size-limited
- No persistent user data storage
- Secrets never hardcoded; loaded from env
- CORS restricts frontend origins
- Error responses never leak sensitive info
- Backend container runs as non-root

## Operational Conventions
- All config via environment variables
- All errors/logs include request IDs
- Monitoring via `/metrics` (in-memory, not persistent)
- Health via `/health`
- No database or persistent storage
- All deployments must pass health/metrics checks

## Important Engineering Rules
- Never bypass schema validation
- Always log errors with context
- Fallback logic must be enabled for reliability
- All new endpoints require strict request/response models
- No sensitive data in logs or responses
- All changes must be documented for future agents

## Extension Guidance
- Add endpoints by creating new routers/services (backend)
- Extend AI logic in Gemini/heuristic services
- Add validation/monitoring layers as needed
- Update frontend components for new features
- Always enforce schema validation and structured outputs
- Document all changes in agent-native docs

---

**This file is the canonical, condensed context for AI agents.**
