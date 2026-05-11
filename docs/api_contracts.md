# API Contracts

## Analyze Endpoint

### POST `/analyze`

**Description:**
Analyze a resume (text or file) for ATS score, missing skills, strengths, and recommendations.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `resume_text` (string, optional): Resume text (min 80 chars)
  - `resume_file` (file, optional): PDF or TXT file
  - `target_role` (string, optional): Target job role
  - `job_description` (string, optional): Job description/context

**Constraints:**
- Must provide either `resume_text` or `resume_file`, not both.
- Resume text/file is required.

**Response:**
- 200 OK
- Content-Type: `application/json`
- Body:
```json
{
  "ats_score": 82,
  "missing_skills": ["sql", "terraform"],
  "strengths": ["docker", "ci/cd"],
  "recommendations": ["Add more cloud experience"]
}
```

**Error Responses:**
- 400 Bad Request: Invalid input, missing fields, or both text and file provided.
- 502/503/504: AI service errors, timeouts, or configuration issues.

---

## Health Endpoint

### GET `/health`

**Description:**
Returns system health and environment info.

**Response:**
```json
{
  "status": "ok",
  "environment": "production",
  "gemini_configured": true
}
```

---

## Metrics Endpoint

### GET `/metrics`

**Description:**
Returns operational metrics for monitoring.

**Response:**
```json
{
  "total_requests": 123,
  "total_errors": 2,
  "average_latency_ms": 45.2,
  "requests_by_path": {"/analyze": 100, "/health": 23}
}
```
