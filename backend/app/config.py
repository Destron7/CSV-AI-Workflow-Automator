"""
Configuration settings for the CSV AI Workflow Automator
"""

import os
from typing import List


class Settings:
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CSV AI Workflow Automator"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered CSV data analysis and workflow automation"

    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.56.1:3000",
    ]

    # File Upload Settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".csv"]

    # Data Processing Settings
    MAX_PREVIEW_ROWS: int = 100
    DEFAULT_PREVIEW_ROWS: int = 5

    # Agent Settings
    AGENT_MAX_ITERATIONS: int = 12
    AGENT_MAX_EXECUTION_TIME: int = 120  # seconds

    # Dashboard Pipeline Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
    OLLAMA_API_KEY: str = os.getenv("OLLAMA_API_KEY", "")
    OLLAMA_ANALYZE_MODEL: str = os.getenv("OLLAMA_ANALYZE_MODEL", "devstral-small-2:24b")
    OLLAMA_QA_MODEL: str = os.getenv("OLLAMA_QA_MODEL", "qwen3-next:80b")
    MAX_RETRY_COUNT: int = int(os.getenv("MAX_RETRY_COUNT", "2"))
    CACHE_SIMILARITY_THRESHOLD: float = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.88"))
    SESSION_TTL_MINUTES: int = int(os.getenv("SESSION_TTL_MINUTES", "60"))
    MAX_RAW_ROWS: int = int(os.getenv("MAX_RAW_ROWS", "500"))


settings = Settings()
