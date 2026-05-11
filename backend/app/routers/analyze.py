from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.schemas.resume import AnalyzeResponse
from app.services.resume_service import ResumeAnalyzerService, get_resume_analyzer_service

router = APIRouter(tags=["resume-analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume_text: str | None = Form(default=None),
    target_role: str | None = Form(default=None),
    job_description: str | None = Form(default=None),
    resume_file: UploadFile | None = File(default=None),
    service: ResumeAnalyzerService = Depends(get_resume_analyzer_service),
) -> AnalyzeResponse:
    return await service.analyze(
        resume_text=resume_text,
        resume_file=resume_file,
        target_role=target_role,
        job_description=job_description,
    )

