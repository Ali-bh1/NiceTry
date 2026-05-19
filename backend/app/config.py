"""
Application configuration using Pydantic Settings.
Loads from environment variables and .env file.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Central configuration for the Phishing Detection Platform."""

    # --- Application ---
    APP_NAME: str = "Phishing Detection Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./phishing_platform.db"

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "chrome-extension://*",
    ]

    # --- ML Model ---
    MODEL_DIR: str = str(Path(__file__).parent.parent / "ml" / "models")
    MODEL_FILE: str = "xgboost_phishing.joblib"
    DETECTION_THRESHOLD: float = 0.5
    HIGH_RISK_THRESHOLD: float = 0.75

    # --- Detection ---
    BRAND_SIMILARITY_THRESHOLD: float = 0.80
    VISUAL_CLONE_THRESHOLD: float = 0.85
    MAX_REDIRECT_DEPTH: int = 10
    URL_ANALYSIS_TIMEOUT: int = 10  # seconds

    # --- AI Investigator ---
    AI_PROVIDER: str = "template"  # "template", "openai", "gemini"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
