"""
Dashboard Chat API endpoint.

POST /dashboard-chat — unified endpoint for CSV upload + dashboard generation + Q&A.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import logging

from app.services.dashboard_session import get_session, save_session

router = APIRouter()
logger = logging.getLogger(__name__)

# Lazy-import the compiled graph to avoid import-time Gemini config issues
_graph = None


def _get_graph():
    global _graph
    if _graph is None:
        from app.graph.builder import graph
        _graph = graph
    return _graph


@router.post("/dashboard-chat")
async def dashboard_chat(
    session_id: str = Form(...),
    question: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    """
    Unified endpoint for CSV dashboard generation and Q&A.

    - First call: send file + question → full pipeline → dashboard + answer
    - Follow-up calls: send question only → Q&A only → answer (dashboard=null)
    """
    # 1. Validate file extension if provided
    if file is not None:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    # 2. Rehydrate state from session store
    state = get_session(session_id)

    # 3. Check: first call must have a file
    if file is None and state.get("payload") is None:
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file to start.",
        )

    # Track whether payload already exists (to decide what to return)
    had_payload = state.get("payload") is not None

    # 4. Attach CSV data if file provided
    if file is not None:
        csv_bytes = await file.read()
        state["csv_bytes"] = csv_bytes
        state["filename"] = file.filename
        # Reset pipeline state for fresh analysis
        state["payload"] = None
        state["chart_configs"] = None
        state["filter_specs"] = None
        state["chart_data"] = None
        state["summary_text"] = None
        state["retry_count"] = 0
        state["error"] = None
        had_payload = False

    # 5. Set user question
    state["user_question"] = question

    # 6. Invoke the graph
    graph = _get_graph()
    try:
        result = graph.invoke(state)
    except Exception as e:
        logger.error(f"Graph execution error: {e}")
        raise HTTPException(status_code=422, detail=f"Pipeline error: {str(e)}")

    # 7. Save updated state
    save_session(session_id, result)

    # 8. Check for hard errors where no dashboard payload was built
    if result.get("error") and not result.get("payload"):
        raise HTTPException(status_code=422, detail=result["error"])

    # 9. Strip [cached] prefix from answer
    answer = result.get("chat_answer") or ""
    if answer.startswith("[cached] "):
        answer = answer[len("[cached] "):]

    # 10. Build response — only include dashboard on first call
    dashboard = None
    if not had_payload and result.get("payload"):
        dashboard = result["payload"]

    # Clean chat history for response (remove any internal fields)
    chat_history = result.get("chat_history") or []

    return {
        "answer": answer,
        "dashboard": dashboard,
        "chat_history": chat_history,
    }

@router.post("/apply-filters")
async def apply_filters(
    session_id: str = Form(...),
    filters: str = Form(...),
):
    """
    Lightning-fast endpoint for applying filters.
    Does NOT invoke the LLM. It parses the CSV, applies active filters,
    and runs pandas compute_aggregations.
    """
    state = get_session(session_id)
    if "csv_bytes" not in state or not state.get("chart_configs"):
        raise HTTPException(status_code=400, detail="No active dashboard found")

    import pandas as pd
    import io
    import json
    from app.graph.nodes import compute_aggregations

    try:
        active_filters = json.loads(filters)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid filters JSON")

    try:
        df = pd.read_csv(io.BytesIO(state["csv_bytes"]), on_bad_lines="skip", sep=None, engine="python")
    except Exception as e:
        logger.warning(f"Python engine parsing failed in apply_filters: {e}")
        df = pd.read_csv(io.BytesIO(state["csv_bytes"]), on_bad_lines="skip")
    
    # Optional: convert dates ahead of time if we needed, but pandas is smart enough
    filter_specs = {f["column"]: f for f in state.get("filter_specs", [])}

    # Apply each filter to df
    for col, val in active_filters.items():
        if col not in df.columns or col not in filter_specs:
            continue
            
        ftype = filter_specs[col]["filterType"]

        if ftype == "multiselect" and isinstance(val, list) and len(val) > 0:
            df = df[df[col].isin(val)]
        elif ftype == "slider":
            # In our UI, slider returns a single number representing the current value.
            df = df[df[col] <= float(val)]
        elif ftype == "daterange" and isinstance(val, dict):
            # Parse dates and filter safely
            dates = pd.to_datetime(df[col], errors="coerce")
            
            if "from" in val and val["from"]:
                df = df[dates >= pd.to_datetime(val["from"])]
            if "to" in val and val["to"]:
                # Ensure we capture the whole day if to string is just "YYYY-MM-DD"
                to_date = pd.to_datetime(val["to"]) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
                df = df[dates <= to_date]
                
        elif ftype == "toggle" and val is True:
            # Assuming toggle means boolean True 
            # (or truthy items like "Yes" / 1)
            df = df[df[col].isin([True, 1, "True", "true", "Yes", "yes", "1.0"])]

    # Create an ephemeral state to run aggregations
    ephemeral_state = {
        "df": df,
        "chart_configs": state["chart_configs"]
    }

    # Re-run chart aggregations on the filtered dataframe
    result = compute_aggregations(ephemeral_state)

    # Return updated payload (we just overwrite the charts)
    payload = dict(state.get("payload", {}))
    payload["charts"] = result.get("chart_data", [])
    
    return {"dashboard": payload}
