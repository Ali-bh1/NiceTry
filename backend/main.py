"""
Phishing Detection Platform — FastAPI Application

Entry point for the backend API server. Configures CORS,
lifespan events (DB init, model loading), and route mounting.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.database import init_db
from app.services.detection import l2_ml_engine
from app.api.routes import router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown) ──────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and ML model on startup."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize database tables
    await init_db()
    logger.info("Database initialized")

    # Load ML model
    l2_ml_engine.load_model()
    logger.info("ML model loaded")

    yield

    logger.info("Shutting down")


# ─── App Factory ─────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered phishing detection with 7-layer analysis pipeline",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware Stack ────────────────────────────────────────────────────────
# Order matters: outermost middleware runs first on request, last on response.

# 1. CORS — must be outermost for preflight OPTIONS to work
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Request ID — assigns X-Request-ID for tracing
app.add_middleware(RequestIDMiddleware)

# 3. Rate limiting — per-IP token bucket
app.add_middleware(RateLimitMiddleware)


# ─── Global Exception Handler ───────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred",
        },
    )


# ─── Mount Routes ───────────────────────────────────────────────────────────

app.include_router(router, prefix=settings.API_PREFIX)


# ─── Root Endpoint ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Detect. Explain. Protect.",
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX,
    }


# ─── Run with Uvicorn ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
