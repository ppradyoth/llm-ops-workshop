from collections import Counter

from app.schemas.resume import AnalyzePayload, AnalyzeResponse


TECH_SKILLS = {
    "python",
    "sql",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "fastapi",
    "react",
    "javascript",
    "typescript",
    "machine learning",
    "mlops",
    "ci/cd",
    "terraform",
    "airflow",
    "spark",
    "pandas",
    "numpy",
    "llm",
    "rag",
    "monitoring",
}


class HeuristicResumeService:
    """Local fallback used for development and CI when no Gemini key is present."""

    async def analyze(self, payload: AnalyzePayload) -> AnalyzeResponse:
        text = payload.resume_text.lower()
        job_text = f"{payload.target_role or ''} {payload.job_description or ''}".lower()

        resume_skills = {skill for skill in TECH_SKILLS if skill in text}
        desired_skills = {skill for skill in TECH_SKILLS if skill in job_text} or TECH_SKILLS
        missing_skills = sorted(desired_skills - resume_skills)[:8]

        score = 45
        score += min(len(resume_skills) * 4, 28)
        score += 10 if any(char.isdigit() for char in payload.resume_text) else 0
        score += 8 if any(word in text for word in ["led", "built", "owned", "improved", "reduced"]) else 0
        score += 6 if len(payload.resume_text.split()) > 180 else 0
        score -= min(len(missing_skills) * 2, 15)
        score = max(0, min(100, score))

        strengths = self._strengths(text, resume_skills)
        recommendations = self._recommendations(missing_skills, payload.resume_text)

        return AnalyzeResponse(
            ats_score=score,
            missing_skills=missing_skills,
            strengths=strengths,
            recommendations=recommendations,
        )

    def _strengths(self, text: str, resume_skills: set[str]) -> list[str]:
        strengths = []
        if resume_skills:
            skills = ", ".join(sorted(resume_skills)[:6])
            strengths.append(f"Includes relevant technical keywords: {skills}.")
        if any(char.isdigit() for char in text):
            strengths.append("Uses numbers, which helps communicate measurable impact.")
        if any(word in text for word in ["built", "led", "launched", "improved", "optimized"]):
            strengths.append("Uses action-oriented language to describe ownership and outcomes.")
        return strengths or ["The resume provides a starting point for role-specific optimization."]

    def _recommendations(self, missing_skills: list[str], resume_text: str) -> list[str]:
        words = Counter(resume_text.lower().split())
        recommendations = [
            "Add quantified impact to each major project or work experience bullet.",
            "Group technical skills into clear categories so ATS systems can parse them easily.",
        ]
        if missing_skills:
            recommendations.insert(0, f"Add evidence for these missing keywords where truthful: {', '.join(missing_skills[:5])}.")
        if words["responsible"] > 0:
            recommendations.append("Replace passive wording like 'responsible for' with action verbs and outcomes.")
        return recommendations[:5]

