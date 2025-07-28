"""
API v1 router aggregation
"""

from fastapi import APIRouter

from .endpoints import health, csv_analysis

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(csv_analysis.router, prefix="/csv", tags=["csv-analysis"])
