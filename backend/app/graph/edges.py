"""
Conditional edge functions for the LangGraph dashboard pipeline.
"""

import os
import logging

logger = logging.getLogger(__name__)


def route_from_orchestrator(state) -> str:
    """Entry point router. If payload exists, skip to Q&A."""
    if state.get("payload") is not None:
        logger.info("Payload exists — routing to Q&A")
        return "check_chat_cache"
    logger.info("No payload — routing to full dashboard pipeline")
    return "parse_csv"


def route_after_validation(state) -> str:
    """After validate_llm_output: retry, fail, or continue."""
    max_retries = int(os.getenv("MAX_RETRY_COUNT", "2"))
    if state.get("error"):
        if state.get("retry_count", 0) < max_retries:
            logger.info("Validation failed — retrying")
            return "retry"
        logger.error("Validation failed — max retries exhausted")
        return "end_with_error"
    return "infer_filters"


def route_after_cache_check(state) -> str:
    """After cache check: use cached answer or call Gemini."""
    if (state.get("chat_answer") or "").startswith("[cached]"):
        logger.info("Using cached answer")
        return "end"
    return "gemini_qa"
