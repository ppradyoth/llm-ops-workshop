import asyncio
import json
import logging

from app.config import Settings
from app.schemas.resume import ANALYSIS_JSON_SCHEMA, AnalyzePayload, AnalyzeResponse
from app.utils.exceptions import AIConfigurationError, AIOutputError, AIServiceError, AITimeoutError
from app.utils.retry import retry_async

logger = logging.getLogger(__name__)


class GeminiResumeService:
    """Gemini-backed resume analysis service with structured JSON output."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None

    @property
    def client(self):
        if self._client is not None:
            return self._client

        if not self.settings.gemini_api_key:
            raise AIConfigurationError("GEMINI_API_KEY is not configured.")

        try:
            from google import genai
        except ImportError as exc:
            raise AIConfigurationError("google-genai is not installed.") from exc

        self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client

    async def analyze(self, payload: AnalyzePayload) -> AnalyzeResponse:
        return await retry_async(
            attempts=self.settings.gemini_retry_attempts,
            delay_seconds=self.settings.gemini_retry_base_delay_seconds,
            retry_exceptions=(AIServiceError, AITimeoutError),
        )(self._analyze_once)(payload)

    async def _analyze_once(self, payload: AnalyzePayload) -> AnalyzeResponse:
        prompt = self._build_prompt(payload)
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(self._generate_content, prompt),
                timeout=self.settings.gemini_timeout_seconds,
            )
        except TimeoutError as exc:
            raise AITimeoutError("Gemini request timed out.") from exc
        except (AIConfigurationError, AIOutputError):
            raise
        except Exception as exc:
            logger.warning("gemini_request_failed", extra={"error": str(exc)})
            raise AIServiceError("Gemini request failed.") from exc

        return self._parse_response(response)

    def _generate_content(self, prompt: str):
        return self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": ANALYSIS_JSON_SCHEMA,
                "temperature": 0.2,
            },
        )

    def _parse_response(self, response) -> AnalyzeResponse:
        raw_text = getattr(response, "text", None)
        if not raw_text:
            raise AIOutputError("Gemini returned an empty response.")

        try:
            result = AnalyzeResponse.model_validate_json(raw_text)
            return result.model_copy(update={"engine": "gemini"})
        except json.JSONDecodeError as exc:
            logger.warning("malformed_ai_json", extra={"raw_output": raw_text[:1000]})
            raise AIOutputError("Gemini returned malformed JSON.") from exc
        except Exception as exc:
            logger.warning("invalid_ai_schema", extra={"raw_output": raw_text[:1000]})
            raise AIOutputError("Gemini returned JSON that did not match the response schema.") from exc

    def _build_prompt(self, payload: AnalyzePayload) -> str:
        role = payload.target_role or "the candidate's target role"
        job_context = payload.job_description or "No job description was provided."
        return f"""
You are an expert resume reviewer, ATS optimizer, and career assistant.

Analyze the resume for: {role}

Return only JSON matching this schema:
- ats_score: integer 0-100
- missing_skills: array of concise skill or keyword gaps
- strengths: array of concise strengths found in the resume
- recommendations: array of actionable improvements

Scoring rubric:
- Keyword match and role alignment
- Quantified impact and clarity
- Skills completeness
- ATS-friendly structure
- Relevance to the target role or job description

Job description or role context:
{job_context}

Resume:
{payload.resume_text}
""".strip()
