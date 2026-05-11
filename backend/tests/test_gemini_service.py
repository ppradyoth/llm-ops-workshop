import asyncio
from types import SimpleNamespace

import pytest

from app.config import Settings
from app.schemas.resume import AnalyzePayload
from app.services.gemini_service import GeminiResumeService
from app.utils.exceptions import AIOutputError


class FakeModels:
    def __init__(self, text: str):
        self.text = text

    def generate_content(self, **kwargs):
        return SimpleNamespace(text=self.text)


class FakeClient:
    def __init__(self, text: str):
        self.models = FakeModels(text)


def test_gemini_service_validates_structured_output() -> None:
    service = GeminiResumeService(
        Settings(GEMINI_API_KEY="test-key", GEMINI_TIMEOUT_SECONDS=5)
    )
    service._client = FakeClient(
        """
        {
          "ats_score": 88,
          "missing_skills": ["Kubernetes"],
          "strengths": ["Strong Python and API experience"],
          "recommendations": ["Add deployment metrics"]
        }
        """
    )

    result = asyncio.run(
        service.analyze(
            AnalyzePayload(
                resume_text="Python engineer with FastAPI and Docker experience. Built APIs and improved reliability by 35 percent across machine learning services.",
                target_role="MLOps Engineer",
            )
        )
    )

    assert result.ats_score == 88
    assert result.missing_skills == ["Kubernetes"]


def test_gemini_service_rejects_malformed_output() -> None:
    service = GeminiResumeService(
        Settings(GEMINI_API_KEY="test-key", GEMINI_TIMEOUT_SECONDS=5)
    )
    service._client = FakeClient('{"ats_score": 150}')

    with pytest.raises(AIOutputError):
        asyncio.run(
            service.analyze(
                AnalyzePayload(
                    resume_text="Python engineer with FastAPI and Docker experience. Built APIs and improved reliability by 35 percent across machine learning services.",
                    target_role="MLOps Engineer",
                )
            )
        )
