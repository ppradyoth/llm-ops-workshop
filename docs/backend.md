# Backend Design

## Overview

The backend is a FastAPI application structured for clarity, reliability, and extensibility. It exposes endpoints for resume analysis, health checks, and metrics, and orchestrates AI and validation logic.

## Key Components

- **Routers**: Define API endpoints (`/analyze`, `/health`, `/metrics`).
- **Services**: Encapsulate business logic (resume analysis, Gemini integration, heuristics, monitoring).
- **Schemas**: Pydantic models for request/response validation and output enforcement.
- **Utils**: Logging, PDF extraction, retry logic, and custom exceptions.
- **Middleware**: Request context, CORS, and monitoring.

## Orchestration Flow

1. **Input Handling**: Accepts resume text or file, target role, and job description.
2. **Validation**: Enforces schema constraints (length, type, allowed fields).
3. **Text Extraction**: Extracts text from PDF/TXT if needed.
4. **AI Analysis**: Calls Gemini API for structured analysis, with retry and timeout logic.
5. **Fallback**: Uses local heuristic analysis if Gemini is unavailable or fails.
6. **Structured Output**: Validates and returns JSON conforming to strict schema.
7. **Monitoring**: Records request metrics and errors for observability.

## Reliability Features

- Timeout and retry logic for AI calls.
- Fallback to local analysis for resilience.
- Centralized error handling and logging.
- Health and metrics endpoints for monitoring.

## Extensibility

- Add new endpoints by creating routers and services.
- Extend AI logic by updating Gemini or heuristic services.
- Add new validation or monitoring layers as needed.
