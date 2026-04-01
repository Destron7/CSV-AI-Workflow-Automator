"""
LangGraph StateGraph assembly and compilation.

The graph is compiled once at module level and reused across all requests.
"""

import logging

from langgraph.graph import StateGraph, END
from app.graph.state import DashboardState
from app.graph.nodes import (
    parse_csv,
    build_schema_summary,
    gemini_analyze,
    validate_llm_output,
    retry,
    infer_filters,
    compute_aggregations,
    assemble_payload,
    check_chat_cache,
    gemini_qa,
    detect_chart_intent,
    remove_chart_from_payload,
    build_new_chart,
    append_chart_to_payload,
)
from app.graph.edges import (
    route_from_orchestrator,
    route_after_validation,
    route_after_cache_check,
    route_after_detect,
)

logger = logging.getLogger(__name__)


def build_graph():
    """Assemble and compile the dashboard + Q&A pipeline graph."""
    builder = StateGraph(DashboardState)

    # Register nodes
    builder.add_node("parse_csv", parse_csv)
    builder.add_node("build_schema_summary", build_schema_summary)
    builder.add_node("gemini_analyze", gemini_analyze)
    builder.add_node("validate_llm_output", validate_llm_output)
    builder.add_node("retry", retry)
    builder.add_node("infer_filters", infer_filters)
    builder.add_node("compute_aggregations", compute_aggregations)
    builder.add_node("assemble_payload", assemble_payload)
    builder.add_node("check_chat_cache", check_chat_cache)
    builder.add_node("gemini_qa", gemini_qa)

    # Register new chart nodes
    builder.add_node("detect_chart_intent", detect_chart_intent)
    builder.add_node("build_new_chart", build_new_chart)
    builder.add_node("append_chart_to_payload", append_chart_to_payload)
    builder.add_node("remove_chart_from_payload", remove_chart_from_payload)

    # Entry point — orchestrator is a conditional edge from START
    builder.set_conditional_entry_point(route_from_orchestrator, {
        "parse_csv": "parse_csv",
        "check_chat_cache": "check_chat_cache",
    })

    # Dashboard pipeline
    builder.add_edge("parse_csv", "build_schema_summary")
    builder.add_edge("build_schema_summary", "gemini_analyze")
    builder.add_edge("gemini_analyze", "validate_llm_output")
    builder.add_conditional_edges("validate_llm_output", route_after_validation, {
        "retry": "retry",
        "end_with_error": END,
        "infer_filters": "infer_filters",
    })
    builder.add_edge("retry", "gemini_analyze")
    builder.add_edge("infer_filters", "compute_aggregations")
    builder.add_edge("compute_aggregations", "assemble_payload")

    # Loopback: after assembling payload, proceed to Q&A
    builder.add_edge("assemble_payload", "check_chat_cache")

    # Q&A flow
    builder.add_conditional_edges("check_chat_cache", route_after_cache_check, {
        "detect_chart_intent": "detect_chart_intent",
        "end": END,
    })
    
    builder.add_conditional_edges("detect_chart_intent", route_after_detect, {
        "build_new_chart": "build_new_chart",
        "remove_chart_from_payload": "remove_chart_from_payload",
        "gemini_qa": "gemini_qa",
    })

    builder.add_edge("build_new_chart", "append_chart_to_payload")
    builder.add_edge("append_chart_to_payload", END)
    
    builder.add_edge("remove_chart_from_payload", END)

    builder.add_edge("gemini_qa", END)

    compiled = builder.compile()
    logger.info("Dashboard pipeline graph compiled successfully")
    return compiled


# Compile once at module level — reused for all requests
graph = build_graph()
