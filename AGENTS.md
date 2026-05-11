
# Agent-Native Documentation & System Overview

This project is engineered for agent-native understanding, maintenance, and extension. All documentation is structured for advanced AI coding agents, LLMs, and future contributors to:

- Fully reconstruct, explain, and evolve the system
- Understand all operational, architectural, and reliability decisions
- Safely extend, debug, and deploy the project

## Documentation Map

- [README.md](README.md): Quickstart, architecture, and setup
- [docs/architecture.md](docs/architecture.md): System and component architecture
- [docs/backend.md](docs/backend.md): Backend orchestration, validation, and reliability
- [docs/frontend.md](docs/frontend.md): Frontend data flow and UX
- [docs/reliability.md](docs/reliability.md): Reliability engineering and failure handling
- [docs/security.md](docs/security.md): Security assumptions and guardrails
- [docs/workflows.md](docs/workflows.md): Operational and deployment workflows
- [docs/api_contracts.md](docs/api_contracts.md): API contracts and schemas
- [docs/deployment.md](docs/deployment.md): Deployment architecture and environment variables
- [docs/troubleshooting.md](docs/troubleshooting.md): Troubleshooting and debugging
- [docs/project_explainer.md](docs/project_explainer.md): High-context system explainer for agents

## Agent Usage Principles

- Always consult `docs/project_explainer.md` for the system mental model and extension points
- Use strict schema validation for all new endpoints and outputs
- Maintain separation of concerns: validation, orchestration, AI, monitoring
- Extend via modular routers/services (backend) and components (frontend)
- All changes must be documented for future agents and contributors

## System Boundaries & Extension

- Backend: FastAPI, modular, strict validation, fallback logic, observability
- Frontend: React, Vite, TailwindCSS, robust error handling
- AI Layer: Gemini API with fallback, strict output schema
- Deployment: Docker, Render, Firebase

For a full system explainer, see [docs/project_explainer.md](docs/project_explainer.md).