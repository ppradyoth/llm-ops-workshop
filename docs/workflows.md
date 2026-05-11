# Operational Workflows

## Local Development

1. Clone the repository.
2. Copy `.env.example` to `.env` and set required variables.
3. Start backend and frontend using Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access frontend at `http://localhost:5173` and backend at `http://localhost:8000`.

## Testing

- Run backend tests:
  ```bash
  cd backend
  pytest
  ```
- Frontend tests (if present) can be run via npm scripts.

## Deployment

- **Backend**: Deploy to Render using `render.yaml` (Docker-based, health checks enabled).
- **Frontend**: Deploy to Firebase Hosting using `firebase.json` and Vite build output.

## CI/CD

- GitHub Actions workflow runs tests and builds on push.
- Linting, type checks, and test coverage can be added as needed.

## Monitoring

- Access `/metrics` endpoint for real-time operational stats.
- Use `/health` for liveness checks.

## Failure Recovery

- If Gemini API fails, system falls back to local analysis.
- All errors are logged with request IDs for traceability.
