from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    gemini_configured: bool


class ReadinessResponse(HealthResponse):
    checks: dict[str, bool]


class MetricsResponse(BaseModel):
    total_requests: int
    total_errors: int
    average_latency_ms: float
    requests_by_path: dict[str, int]
