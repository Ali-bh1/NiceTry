"""
Request ID Middleware

Assigns a unique correlation ID to every inbound request for
distributed tracing and log correlation. The ID propagates
via the X-Request-ID response header.
"""

import uuid
import logging
from contextvars import ContextVar

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Context variable for the current request ID (accessible from any async task)
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    """Retrieve the current request ID from context."""
    return request_id_ctx.get()


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Attach a unique X-Request-ID to every request/response cycle.

    If the client sends an X-Request-ID header, it is reused (useful
    for end-to-end tracing from a browser extension). Otherwise a
    new UUID4 is generated.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Reuse client-provided ID or generate a new one
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = request_id_ctx.set(req_id)

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            request_id_ctx.reset(token)
