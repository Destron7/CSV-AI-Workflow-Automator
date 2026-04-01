"""
In-memory session store for the dashboard pipeline.

Sessions map session_id → (DashboardState, timestamp).
Expired sessions are treated as new — user must re-upload.
"""

import time
import logging

from app.config import settings
from app.graph.state import DashboardState

logger = logging.getLogger(__name__)

TTL = settings.SESSION_TTL_MINUTES * 60

_store: dict[str, tuple[DashboardState, float]] = {}


def get_session(session_id: str) -> DashboardState:
    """Return existing session state or a fresh empty state."""
    if session_id in _store:
        state, ts = _store[session_id]
        if time.time() - ts < TTL:
            return state
        logger.info(f"Session {session_id} expired — removing")
        del _store[session_id]
    return _blank_state()


def save_session(session_id: str, state: DashboardState) -> None:
    """Persist session state with current timestamp."""
    _store[session_id] = (state, time.time())


def _blank_state() -> DashboardState:
    """Create a fresh empty state dict."""
    return {
        "csv_bytes": None,
        "filename": None,
        "user_question": None,
        "df": None,
        "columns": None,
        "row_count": None,
        "schema_summary": None,
        "raw_llm_output": None,
        "retry_count": 0,
        "chart_configs": None,
        "filter_specs": None,
        "summary_text": None,
        "chart_data": None,
        "payload": None,
        "chat_history": [],
        "chat_answer": None,
        "is_chart_request": False,
        "is_remove_chart_request": False,
        "pending_chart": None,
        "error": None,
    }
