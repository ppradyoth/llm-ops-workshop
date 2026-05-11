# Troubleshooting Guide

## Common Issues

### 1. Backend Fails to Start
- **Check**: Environment variables in `.env` are set (especially `GEMINI_API_KEY` for production).
- **Check**: Docker image builds without errors.
- **Check**: Required Python packages are installed.

### 2. Analyze Endpoint Returns 502/503/504
- **Check**: Gemini API key is valid and not rate-limited.
- **Check**: Network connectivity to Gemini API.
- **Check**: Fallback logic is enabled for development.
- **Check**: Logs for AI service errors or timeouts.

### 3. Resume Upload Fails
- **Check**: File is PDF or TXT and under size limit.
- **Check**: Only one of text or file is provided.

### 4. Frontend Cannot Reach Backend
- **Check**: API base URL in frontend `.env` matches backend URL.
- **Check**: CORS settings allow frontend origin.

### 5. Metrics or Health Endpoints Unreachable
- **Check**: Backend is running and accessible on port 8000.
- **Check**: No firewall or network blockages.

## Debugging Tips

- Use logs for request IDs and error context.
- Use `/metrics` to check for error spikes or latency.
- Use `/health` to verify environment and Gemini config.

## Extending Troubleshooting

- Add more granular error codes and messages.
- Integrate with external monitoring for alerting.
