"""
Response models for API endpoints
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    """Information about a single column"""

    name: str
    data_type: str
    null_count: int
    unique_count: Optional[int] = None
    sample_values: Optional[List[str]] = None


class CSVAnalysisResponse(BaseModel):
    """Response model for CSV analysis"""

    filename: str
    num_rows: int
    num_columns: int
    columns: List[str]
    columns_info: List[ColumnInfo]
    preview_data: List[Dict[str, Any]]
    file_size: Optional[int] = None


class WorkflowResponse(BaseModel):
    """Response model for workflow processing"""

    message: str
    cleaned_data_shape: Optional[Dict[str, int]] = None
    causal_analysis_results: Optional[Dict[str, Any]] = None
    processing_time: Optional[float] = None
    output_type: str


class HealthResponse(BaseModel):
    """Health check response"""

    status: str
    message: str
    version: str


class ErrorResponse(BaseModel):
    """Error response model"""

    detail: str
    error_code: Optional[str] = None
