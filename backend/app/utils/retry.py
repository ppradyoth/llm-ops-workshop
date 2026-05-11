import asyncio
import logging
import random
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
T = TypeVar("T")
logger = logging.getLogger(__name__)


def retry_async(
    attempts: int,
    delay_seconds: float,
    retry_exceptions: tuple[type[Exception], ...],
    max_delay_seconds: float = 8.0,
    jitter_seconds: float = 0.25,
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    def decorator(func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_error: Exception | None = None
            for attempt in range(1, attempts + 1):
                try:
                    if attempt > 1:
                        logger.info(
                            "retry_attempt_started",
                            extra={
                                "operation": func.__name__,
                                "attempt": attempt,
                                "max_attempts": attempts,
                            },
                        )
                    return await func(*args, **kwargs)
                except retry_exceptions as exc:
                    last_error = exc
                    if attempt == attempts:
                        break
                    sleep_seconds = min(delay_seconds * (2 ** (attempt - 1)), max_delay_seconds)
                    if jitter_seconds > 0:
                        sleep_seconds += random.uniform(0, jitter_seconds)
                    logger.warning(
                        "retryable_error",
                        extra={
                            "operation": func.__name__,
                            "attempt": attempt,
                            "max_attempts": attempts,
                            "sleep_seconds": round(sleep_seconds, 3),
                            "error_type": type(exc).__name__,
                            "error": str(exc),
                        },
                    )
                    await asyncio.sleep(sleep_seconds)
            logger.error(
                "retry_attempts_exhausted",
                extra={
                    "operation": func.__name__,
                    "max_attempts": attempts,
                    "error_type": type(last_error).__name__ if last_error else None,
                    "error": str(last_error) if last_error else None,
                },
            )
            raise last_error or RuntimeError("Retry failed without an exception.")

        return wrapper

    return decorator
