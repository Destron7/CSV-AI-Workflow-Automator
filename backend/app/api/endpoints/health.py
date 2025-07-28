"""
Health check endpoints
"""

from fastapi import APIRouter

from ...models.responses import HealthResponse
from ...config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="CSV AI Workflow Automator is running",
        version=settings.VERSION,
    )


@router.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "description": settings.DESCRIPTION,
    }
