const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text ? { detail: text } : {};
}

function buildErrorMessage(body, fallback) {
  if (body?.detail && body?.request_id) {
    return `${body.detail} Request ID: ${body.request_id}`;
  }

  if (body?.detail) {
    return body.detail;
  }

  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    return body.errors.map((error) => error.msg).join(" ");
  }

  return fallback;
}

export async function analyzeResume({ resumeText, resumeFile, targetRole, jobDescription }) {
  const formData = new FormData();

  if (resumeFile) {
    formData.append("resume_file", resumeFile);
  } else {
    formData.append("resume_text", resumeText);
  }

  if (targetRole) formData.append("target_role", targetRole);
  if (jobDescription) formData.append("job_description", jobDescription);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error(`Could not reach the backend at ${API_BASE_URL}.`);
  }

  const body = await parseResponse(response).catch(() => ({}));
  if (!response.ok) {
    throw new Error(buildErrorMessage(body, "Resume analysis failed."));
  }

  return body;
}

export async function getHealth() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/health`);
  } catch (error) {
    throw new Error(`Could not reach the backend at ${API_BASE_URL}.`);
  }

  const body = await parseResponse(response).catch(() => ({}));
  if (!response.ok) {
    throw new Error(buildErrorMessage(body, "Backend health check failed."));
  }
  return body;
}
