# Frontend Design

## Overview

The frontend is a React application (Vite + TailwindCSS) that provides a simple, robust interface for users to upload resumes, specify job context, and view structured analysis results.

## Key Components

- **AnalysisForm**: Handles resume text/file input, target role, and job description. Validates input before submission.
- **ResultPanel**: Displays ATS score, missing skills, strengths, and recommendations.
- **ErrorBanner**: Shows user-friendly error messages with request IDs for traceability.
- **HealthBadge**: Indicates backend health status.
- **lib/api.js**: Encapsulates API calls, error handling, and response parsing.

## Data Flow

1. User enters resume data and context in the form.
2. On submit, form data is sent as multipart/form-data to `/analyze` endpoint.
3. API responses are parsed and errors are surfaced to the user.
4. Results are rendered in a structured, readable format.

## Reliability & UX

- Validates minimum resume length before allowing submission.
- Handles both file and text input, but not both simultaneously.
- Surfaces backend errors with context for debugging.
- Health check endpoint is polled to display system status.

## Extensibility

- Add new UI features by extending components.
- Update API logic in `lib/api.js` for new endpoints or error handling.
- Style and layout are easily customizable via TailwindCSS.
