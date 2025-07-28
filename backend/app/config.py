"""
Configuration settings for the CSV AI Workflow Automator
"""

from typing import List


class Settings:
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CSV AI Workflow Automator"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered CSV data analysis and workflow automation"

    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    # File Upload Settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".csv"]

    # Data Processing Settings
    MAX_PREVIEW_ROWS: int = 100
    DEFAULT_PREVIEW_ROWS: int = 5


settings = Settings()
