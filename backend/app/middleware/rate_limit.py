"""
Rate Limiting Middleware

Token-bucket rate limiter keyed by client IP. Uses an in-memory store
(sufficient for single-process deployments; swap for Redis in production).
"""

import time
import logging
from collections import defaultdict
from dataclasses import dataclass, field

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TokenBucket:
    """Simple token-bucket for per-IP rate limiting."""
    tokens: float = 0.0
    last_refill: float = field(default_factory=time.monotonic)
    capacity: int = 60
    refill_rate: float = 1.0  # tokens per second

    def consume(self) -> bool:
        """Try to consume one token. Returns True if allowed."""
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

    @property
    def retry_after(self) -> float:
        """Seconds until the next token is available."""
        if self.tokens >= 1.0:
            return 0.0
        return (1.0 - self.tokens) / self.refill_rate


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-IP token-bucket rate limiter.

    Exempt paths (health, docs) are never rate-limited.
    Returns 429 with Retry-After header when limit is exceeded.
    """

    EXEMPT_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/"}

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self._buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(
                tokens=float(settings.RATE_LIMIT_PER_MINUTE),
                capacity=settings.RATE_LIMIT_PER_MINUTE,
                refill_rate=settings.RATE_LIMIT_PER_MINUTE / 60.0,
            )
        )

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, respecting X-Forwarded-For behind a proxy."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for exempt paths
        path = request.url.path.rstrip("/")
        if path in self.EXEMPT_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        bucket = self._buckets[client_ip]

        if not bucket.consume():
            retry_after = int(bucket.retry_after) + 1
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)

        # Add rate limit headers for transparency
        response.headers["X-RateLimit-Limit"] = str(bucket.capacity)
        response.headers["X-RateLimit-Remaining"] = str(int(bucket.tokens))

        return response
