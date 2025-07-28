"""
Request models for API endpoints
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class WorkflowConfigRequest(BaseModel):
    """Configuration for workflow processing"""

    clean_data: bool = True
    causal_analysis: bool = False
    forecasting: bool = False
    simulation: bool = False
    output_type: str = "dashboard"  # "dashboard" or "report"
    treatment_column: Optional[str] = None
    outcome_column: Optional[str] = None


class CSVAnalysisRequest(BaseModel):
    """Request model for CSV analysis (used when file is sent separately)"""

    filename: str
    additional_params: Optional[Dict[str, Any]] = None
