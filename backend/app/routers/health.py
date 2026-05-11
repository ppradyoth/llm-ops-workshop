from fastapi import APIRouter

from app.config import get_settings
from app.schemas.health import HealthResponse, MetricsResponse, ReadinessResponse
from app.services.monitoring_service import metrics

router = APIRouter(tags=["platform"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        environment=settings.environment,
        gemini_configured=bool(settings.gemini_api_key),
    )


@router.get("/live", response_model=HealthResponse)
async def liveness_check() -> HealthResponse:
    return await health_check()


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_check() -> ReadinessResponse:
    settings = get_settings()
    checks = {
        "api": True,
        "configuration_loaded": True,
        "gemini_configured": bool(settings.gemini_api_key),
        "ai_analysis_available": bool(settings.gemini_api_key) or settings.enable_ai_fallback,
    }
    is_ready = checks["api"] and checks["configuration_loaded"] and checks["ai_analysis_available"]
    return ReadinessResponse(
        status="ok" if is_ready else "degraded",
        version=settings.app_version,
        environment=settings.environment,
        gemini_configured=checks["gemini_configured"],
        checks=checks,
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    return metrics.snapshot()
