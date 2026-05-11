from io import BytesIO

from fastapi import UploadFile
from pypdf import PdfReader

from app.utils.exceptions import BadRequestError


async def extract_text_from_upload(upload: UploadFile, max_upload_mb: int) -> str:
    content = await upload.read()
    if not content:
        raise BadRequestError("Uploaded resume file is empty.")

    max_bytes = max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise BadRequestError(f"Resume file must be smaller than {max_upload_mb} MB.")

    filename = (upload.filename or "").lower()
    content_type = upload.content_type or ""

    if filename.endswith(".pdf") or content_type == "application/pdf":
        return _extract_pdf_text(content)

    if filename.endswith(".txt") or content_type.startswith("text/"):
        return content.decode("utf-8", errors="ignore")

    raise BadRequestError("Unsupported file type. Upload a PDF or TXT resume.")


def _extract_pdf_text(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages).strip()
    except Exception as exc:
        raise BadRequestError("Could not extract text from the uploaded PDF.") from exc

    if not text:
        raise BadRequestError("The uploaded PDF did not contain extractable text.")
    return text
