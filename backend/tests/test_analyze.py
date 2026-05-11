from fastapi.testclient import TestClient

from app.main import app


def test_analyze_resume_text() -> None:
    client = TestClient(app)
    resume = """
    Data Scientist with Python, SQL, Docker, FastAPI, and MLOps experience.
    Built model monitoring dashboards, improved inference latency by 30 percent,
    and launched CI/CD pipelines for machine learning services on cloud platforms.
    """

    response = client.post(
        "/analyze",
        data={"resume_text": resume, "target_role": "MLOps Engineer"},
    )

    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["ats_score"] <= 100
    assert isinstance(data["missing_skills"], list)
    assert isinstance(data["strengths"], list)
    assert isinstance(data["recommendations"], list)


def test_analyze_rejects_short_resume_text() -> None:
    client = TestClient(app)

    response = client.post("/analyze", data={"resume_text": "Too short"})

    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "bad_request"
    assert "request_id" in data
