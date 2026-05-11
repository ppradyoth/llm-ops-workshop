import logging
import re

from app.schemas.resume import AnalyzePayload
from app.utils.exceptions import GuardrailError

logger = logging.getLogger(__name__)

# ── Prompt injection patterns ──────────────────────────────────────────────────
# Catch common attempts to hijack the system prompt or override instructions.
_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"disregard\s+(all\s+)?(previous|prior|your)\s+instructions",
        r"forget\s+(everything|all|your\s+instructions)",
        r"you\s+are\s+now\s+",
        r"act\s+as\s+(a\s+|an\s+)?(?!a\s+resume|an\s+applicant)",
        r"pretend\s+(you\s+are|to\s+be)",
        r"from\s+now\s+on\s+you\s+(are|will)",
        r"new\s+instructions?\s*:",
        r"override\s+(your\s+)?(instructions|programming|rules|guidelines)",
        r"(system|user|assistant)\s*:\s*\[?(?!prompt)",  # role injection
        r"<\|?(system|im_start|im_end)\|?>",             # token injection
        r"\bjailbreak\b",
        r"\bDAN\b",                                       # "Do Anything Now"
        r"do\s+anything\s+now",
        r"prompt\s+injection",
    ]
]

# ── Resume topicality signals ──────────────────────────────────────────────────
# A legitimate resume should contain several of these terms.
_RESUME_SIGNALS: frozenset[str] = frozenset(
    {
        # Structure
        "resume", "cv", "curriculum", "vitae", "objective", "summary",
        "profile", "experience", "education", "skills", "certifications",
        "achievements", "references", "portfolio",
        # Employment
        "work", "employment", "employer", "company", "organization", "firm",
        "position", "role", "title", "responsibilities", "duties",
        "intern", "internship", "freelance", "contract", "full-time", "part-time",
        # Seniority
        "junior", "senior", "lead", "principal", "staff", "director",
        "manager", "head", "vp", "president", "founder", "co-founder",
        # Education
        "university", "college", "institute", "school", "degree",
        "bachelor", "master", "phd", "doctorate", "diploma", "gpa",
        "graduated", "major", "minor",
        # Action verbs common in resumes
        "built", "developed", "designed", "implemented", "led", "managed",
        "improved", "increased", "reduced", "launched", "delivered",
        "collaborated", "mentored", "optimized", "automated",
        # Generic tech / role keywords
        "python", "java", "sql", "javascript", "react", "aws", "docker",
        "kubernetes", "machine", "learning", "data", "engineering", "api",
        "software", "engineer", "developer", "analyst", "scientist",
        "years", "projects", "team",
    }
)

_MIN_RESUME_SIGNALS = 4  # minimum distinct signals required


class GuardrailService:
    """
    Rule-based input/output guardrails. Runs before the AI call — zero tokens used.

    Two rails:
      1. Injection rail  — rejects prompt injection and jailbreak attempts.
      2. Topicality rail — rejects inputs that don't resemble a resume.
    """

    def check(self, payload: AnalyzePayload) -> None:
        self._injection_rail(payload.resume_text, field="resume_text")
        if payload.job_description:
            self._injection_rail(payload.job_description, field="job_description")
        if payload.target_role:
            self._injection_rail(payload.target_role, field="target_role")
        self._topicality_rail(payload.resume_text)

    # ── Rails ──────────────────────────────────────────────────────────────────

    def _injection_rail(self, text: str, field: str) -> None:
        for pattern in _INJECTION_PATTERNS:
            if pattern.search(text):
                logger.warning(
                    "guardrail_injection_blocked",
                    extra={"field": field, "pattern": pattern.pattern},
                )
                raise GuardrailError(
                    "Input contains patterns that are not permitted. "
                    "Please submit a genuine resume and role description."
                )

    def _topicality_rail(self, text: str) -> None:
        words = set(re.findall(r"\b[a-z][\w\-]*\b", text.lower()))
        matched = words & _RESUME_SIGNALS
        if len(matched) < _MIN_RESUME_SIGNALS:
            logger.warning(
                "guardrail_topicality_blocked",
                extra={"matched_signals": sorted(matched), "count": len(matched)},
            )
            raise GuardrailError(
                "The submitted text does not appear to be a resume. "
                "Please submit a resume or CV."
            )
