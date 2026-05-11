from fastapi.testclient import TestClient

from app.main import app


def test_health_check() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_liveness_and_readiness_checks() -> None:
    client = TestClient(app)

    live_response = client.get("/live")
    ready_response = client.get("/ready")

    assert live_response.status_code == 200
    assert ready_response.status_code == 200
    assert ready_response.json()["checks"]["api"] is True
