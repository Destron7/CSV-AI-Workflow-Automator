"""
DashboardState — shared state TypedDict for the LangGraph pipeline.

Every node in the graph reads from and writes to this single dict.
"""

from typing import TypedDict, Optional
import pandas as pd


class ChatMessage(TypedDict):
    role: str        # "user" | "assistant"
    content: str


class DashboardState(TypedDict):
    # ── per-request inputs ──────────────────────────────────────────
    csv_bytes: Optional[bytes]
    filename: Optional[str]
    user_question: Optional[str]

    # ── dashboard pipeline outputs (persisted across calls) ─────────
    df: Optional[pd.DataFrame]
    columns: Optional[list]          # [{name, type, nulls, unique, sample_values, min, max, mean}]
    row_count: Optional[int]
    schema_summary: Optional[str]    # compact JSON string sent to Gemini
    raw_llm_output: Optional[str]
    retry_count: int
    chart_configs: Optional[list]    # validated chart specs from Gemini
    filter_specs: Optional[list]     # enriched filter specs
    summary_text: Optional[str]
    chart_data: Optional[list]       # chart_configs + aggregated data[]
    payload: Optional[dict]          # final assembled dashboard payload

    # ── Q&A fields ──────────────────────────────────────────────────
    chat_history: list               # list[ChatMessage], grows with every turn
    chat_answer: Optional[str]       # answer to the current question

    # ── error handling ──────────────────────────────────────────────
    error: Optional[str]
