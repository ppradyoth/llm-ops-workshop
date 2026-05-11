from pydantic import BaseModel, Field, field_validator


class AnalyzePayload(BaseModel):
    resume_text: str = Field(min_length=80, max_length=20000)
    target_role: str | None = Field(default=None, max_length=120)
    job_description: str | None = Field(default=None, max_length=8000)

    @field_validator("resume_text", "target_role", "job_description", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return value.strip()


class AnalyzeResponse(BaseModel):
    ats_score: int = Field(ge=0, le=100, description="ATS readiness score from 0 to 100.")
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    @field_validator("missing_skills", "strengths", "recommendations")
    @classmethod
    def remove_empty_items(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]


ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "ats_score": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
            "description": "ATS score from 0 to 100.",
        },
        "missing_skills": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Important skills or keywords missing from the resume.",
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Resume strengths backed by the text.",
        },
        "recommendations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete improvement recommendations.",
        },
    },
    "required": ["ats_score", "missing_skills", "strengths", "recommendations"],
    "additionalProperties": False,
}

