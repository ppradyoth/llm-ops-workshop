# Security & Guardrails

## Security Philosophy

Security is approached with a focus on safe defaults, minimal attack surface, and clear operational boundaries. The system is designed for workshop/demo use but follows production-style security practices where feasible.

## Key Security Measures

- **Input Validation**: All user input is validated and sanitized using Pydantic schemas to prevent injection and malformed data.
- **File Handling**: Only PDF and TXT files are accepted. File size is limited and content is parsed safely.
- **Environment Variables**: Secrets (e.g., Gemini API key) are never hardcoded and are loaded from environment variables.
- **CORS**: Configurable CORS origins restrict cross-origin requests to trusted frontends.
- **Dependency Isolation**: Backend runs in a minimal Docker container with only required packages.
- **No Persistent Storage**: No user data is stored on disk or in a database, reducing data breach risk.
- **Error Handling**: Error responses never leak stack traces or sensitive details to clients.
- **API Key Management**: Gemini API key is required for production analysis and is never exposed to the frontend.

## Operational Guardrails

- **Health and Metrics Endpoints**: Expose only non-sensitive operational data.
- **Logging**: Logs are structured and do not include sensitive user data.
- **Least Privilege**: Backend container runs as non-root by default.

## Extending Security

- Integrate with secret managers for production deployments.
- Add authentication/authorization if exposing beyond demo/workshop use.
- Monitor dependency vulnerabilities and update regularly.
