class AppError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "application_error",
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class BadRequestError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=400, code="bad_request")


class AIServiceError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=502, code="ai_service_error")


class AIConfigurationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=503, code="ai_configuration_error")


class AIOutputError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=502, code="ai_output_error")


class AITimeoutError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=504, code="ai_timeout")
