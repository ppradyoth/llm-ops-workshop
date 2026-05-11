from threading import Lock

from app.schemas.health import MetricsResponse


class MetricsStore:
    """Small in-memory metrics store for workshop-friendly monitoring."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._total_requests = 0
        self._total_errors = 0
        self._latency_ms_total = 0.0
        self._requests_by_path: dict[str, int] = {}

    def record_request(self, path: str, status_code: int, duration_seconds: float) -> None:
        with self._lock:
            self._total_requests += 1
            self._latency_ms_total += duration_seconds * 1000
            self._requests_by_path[path] = self._requests_by_path.get(path, 0) + 1
            if status_code >= 500:
                self._total_errors += 1

    def snapshot(self) -> MetricsResponse:
        with self._lock:
            average_latency = (
                self._latency_ms_total / self._total_requests if self._total_requests else 0.0
            )
            return MetricsResponse(
                total_requests=self._total_requests,
                total_errors=self._total_errors,
                average_latency_ms=round(average_latency, 2),
                requests_by_path=dict(self._requests_by_path),
            )


metrics = MetricsStore()

