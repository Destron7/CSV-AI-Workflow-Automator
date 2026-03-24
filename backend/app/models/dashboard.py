"""
Pydantic schemas for validating Gemini's JSON output in the dashboard pipeline.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ChartConfig(BaseModel):
    id: Optional[str] = "chart_1"
    type: Optional[str] = "bar"
    title: Optional[str] = "Chart"
    xAxis: Optional[str] = ""
    yAxis: Optional[str] = ""
    aggregation: Optional[str] = "none"


class FilterSpec(BaseModel):
    column: Optional[str] = ""
    filterType: Optional[str] = "multiselect"
    label: Optional[str] = "Filter"


class LLMOutput(BaseModel):
    charts: List[ChartConfig] = Field(default_factory=list)
    filters: List[FilterSpec] = Field(default_factory=list)
    summary: str
