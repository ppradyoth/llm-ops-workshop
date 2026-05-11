import logging
import time
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.middleware.request_context import RequestContextMiddleware
from app.routers import analyze, health
from app.services.monitoring_service import metrics
from app.utils.exceptions import AppError
from app.utils.logging import setup_logging

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Production-style AI Resume Analyzer and Career Assistant API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)


@app.middleware("http")
async def monitoring_middleware(request: Request, call_next: Callable) -> Response:
    started_at = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        metrics.record_request(request.url.path, 500, time.perf_counter() - started_at)
        raise

    metrics.record_request(
        request.url.path,
        response.status_code,
        time.perf_counter() - started_at,
    )
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "application_error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "status_code": exc.status_code,
            "code": exc.code,
            "detail": exc.message,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "code": exc.code,
            "request_id": request_id,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.info(
        "request_validation_error",
        extra={"request_id": request_id, "path": request.url.path, "errors": exc.errors()},
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "code": "request_validation_error",
            "request_id": request_id,
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.exception("unhandled_error", extra={"request_id": request_id, "path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Unexpected server error",
            "code": "internal_server_error",
            "request_id": request_id,
        },
    )


app.include_router(health.router)
app.include_router(analyze.router)
