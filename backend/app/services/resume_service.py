import logging

from fastapi import UploadFile
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.schemas.resume import AnalyzePayload, AnalyzeResponse
from app.services.gemini_service import GeminiResumeService
from app.services.guardrail_service import GuardrailService
from app.services.heuristic_service import HeuristicResumeService
from app.utils.exceptions import BadRequestError
from app.utils.pdf import extract_text_from_upload

logger = logging.getLogger(__name__)


class ResumeAnalyzerService:
    """Coordinates input extraction, validation, guardrails, AI analysis, and fallback."""

    def __init__(
        self,
        settings: Settings,
        gemini_service: GeminiResumeService,
        fallback_service: HeuristicResumeService,
        guardrail_service: GuardrailService,
    ):
        self.settings = settings
        self.gemini_service = gemini_service
        self.fallback_service = fallback_service
        self.guardrail_service = guardrail_service

    async def analyze(
        self,
        resume_text: str | None,
        resume_file: UploadFile | None,
        target_role: str | None,
        job_description: str | None,
    ) -> AnalyzeResponse:
        extracted_text = await self._resolve_resume_text(resume_text, resume_file)
        payload = self._validate_payload(extracted_text, target_role, job_description)

        # Guardrails run after validation, before any AI call — zero tokens used.
        self.guardrail_service.check(payload)

        if self.settings.gemini_api_key:
            try:
                return await self.gemini_service.analyze(payload)
            except Exception:
                if not self.settings.enable_ai_fallback:
                    raise
                logger.exception("gemini_failed_using_fallback")

        return await self.fallback_service.analyze(payload)

    async def _resolve_resume_text(
        self,
        resume_text: str | None,
        resume_file: UploadFile | None,
    ) -> str:
        if resume_file is not None and resume_text and resume_text.strip():
            raise BadRequestError("Provide either resume_text or resume_file, not both.")

        if resume_file is not None:
            return await extract_text_from_upload(
                upload=resume_file,
                max_upload_mb=self.settings.max_upload_mb,
            )

        if resume_text and resume_text.strip():
            return resume_text

        raise BadRequestError("Provide resume_text or upload a TXT/PDF resume_file.")

    def _validate_payload(
        self,
        resume_text: str,
        target_role: str | None,
        job_description: str | None,
    ) -> AnalyzePayload:
        try:
            return AnalyzePayload(
                resume_text=resume_text[: self.settings.max_resume_chars],
                target_role=target_role,
                job_description=job_description,
            )
        except ValidationError as exc:
            raise BadRequestError("Resume text must contain at least 80 characters.") from exc


def get_resume_analyzer_service() -> ResumeAnalyzerService:
    settings = get_settings()
    return ResumeAnalyzerService(
        settings=settings,
        gemini_service=GeminiResumeService(settings),
        fallback_service=HeuristicResumeService(),
        guardrail_service=GuardrailService(),
    )
