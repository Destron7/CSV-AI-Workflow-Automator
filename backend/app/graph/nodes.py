"""
LangGraph node functions for the CSV Dashboard + Chat pipeline.

Each node reads from and writes to a DashboardState dict.
LLM calls use Ollama HTTP API (httpx) instead of Google Gemini.
"""

import io
import json
import difflib
import logging
import math

import httpx
import pandas as pd

from app.config import settings
from app.graph.state import DashboardState
from app.models.dashboard import LLMOutput

logger = logging.getLogger(__name__)

# ── Ollama config from settings ────────────────────────────────────
OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
OLLAMA_API_KEY = settings.OLLAMA_API_KEY
ANALYZE_MODEL = settings.OLLAMA_ANALYZE_MODEL
QA_MODEL = settings.OLLAMA_QA_MODEL


# ─────────────────────────────────────────────────────────────────────
# Node: parse_csv
# ─────────────────────────────────────────────────────────────────────
def parse_csv(state: DashboardState) -> dict:
    """Read csv_bytes into a DataFrame. Detect column types and stats."""
    raw = state["csv_bytes"]
    # Provide robust parsing settings to handle malformed rows and varying delimiters
    try:
        df = pd.read_csv(io.BytesIO(raw), on_bad_lines="skip", sep=None, engine="python")
    except Exception as e:
        logger.warning(f"Python engine parsing failed, falling back to basic C engine: {e}")
        df = pd.read_csv(io.BytesIO(raw), on_bad_lines="skip")

    columns = []
    for col in df.columns:
        series = df[col]
        if pd.api.types.is_numeric_dtype(series):
            col_type = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            col_type = "datetime"
        elif series.nunique() <= 30:
            col_type = "categorical"
        else:
            col_type = "text"

        info = {
            "name": col,
            "type": col_type,
            "nulls": int(series.isnull().sum()),
            "unique": int(series.nunique()),
            "sample_values": series.dropna().head(5).astype(str).tolist(),
            "min": float(series.min()) if col_type == "numeric" else None,
            "max": float(series.max()) if col_type == "numeric" else None,
            "mean": float(series.mean()) if col_type == "numeric" else None,
        }
        columns.append(info)

    logger.info(f"Parsed CSV: {len(df)} rows, {len(columns)} columns")
    return {"df": df, "columns": columns, "row_count": len(df)}


# ─────────────────────────────────────────────────────────────────────
# Node: build_schema_summary
# ─────────────────────────────────────────────────────────────────────
def build_schema_summary(state: DashboardState) -> dict:
    """Compact metadata into a JSON string for the LLM."""
    cols_clean = []
    for c in state["columns"]:
        entry = {k: v for k, v in c.items() if v is not None}
        cols_clean.append(entry)

    # Compute notable correlations to force LLM to make better scatter plot decisions
    notable_correlations = []
    try:
        numeric_df = state["df"].select_dtypes(include=["number"])
        if len(numeric_df.columns) >= 2:
            corr_matrix = numeric_df.corr().round(2)
            cols = list(corr_matrix.columns)
            for i in range(len(cols)):
                for j in range(i + 1, len(cols)):
                    val = corr_matrix.iloc[i, j]
                    if pd.notna(val) and abs(val) >= 0.3:
                        notable_correlations.append(f"{cols[i]} <-> {cols[j]}: {val}")
    except Exception as e:
        logger.warning(f"Could not compute correlation hints: {e}")

    summary = {
        "rowCount": state["row_count"],
        "columns": cols_clean,
        "notable_correlations": notable_correlations,
        "sampleRows": (
            state["df"].head(5).to_dict(orient="records")
        ),
    }
    schema_str = json.dumps(summary, default=str)
    logger.info(f"Schema summary: {len(schema_str)} chars")
    return {"schema_summary": schema_str}


# ─────────────────────────────────────────────────────────────────────
# Node: gemini_analyze  (now uses Ollama)
# ─────────────────────────────────────────────────────────────────────
ANALYZE_SYSTEM_PROMPT = """You are a data visualization expert. Given a CSV schema, return ONLY a valid JSON
object with no markdown, no explanation, no preamble. The object must have exactly
these keys:

charts: array of objects, each with:
  - id: string (e.g. "chart_1")
  - type: one of bar | line | pie | scatter | histogram | heatmap | boxplot
  - title: string
  - xAxis: column name string
  - yAxis: column name string
  - aggregation: one of sum | mean | median | count | none

filters: array of objects, each with:
  - column: column name string
  - filterType: one of multiselect | daterange | slider | toggle
  - label: string

summary: 2-3 sentence plain-English description of the dataset.

Only suggest chart types that genuinely suit the column types.
You MUST generate as many distinct chart types as the dataset statistically supports to build a highly comprehensive dashboard.
Specifically, you must strive to include AT LEAST ONE of every possible type:
- A `pie` chart for categorical proportions.
- A `bar` chart for comparative counts or sum aggregations of categories.
- A `line` chart for continuous trends or ordered data relationships.
- A `scatter` chart specifically targeting highly-correlated numeric columns listed in 'notable_correlations'.
- A `boxplot` or `histogram` to showcase the statistical spread of the primary numerical column.
- A `heatmap` if matrix-style numeric categorizations are possible.
Generate AT LEAST 5 TO 7 CHARTS spanning ALL of these diverse types!
Only suggest filters for columns that are useful to filter by. If there are no useful filters, you MUST STILL include the "filters" key with an empty array `[]`. Do the same for charts if none are applicable.
Return ONLY valid JSON. No explanation, no markdown fences, no extra keys."""


def _call_ollama(
    model: str,
    messages: list,
    format_schema=None,
    think=None,
    timeout: float = 120.0,
) -> dict:
    """Call Ollama Cloud API (or local). Supports schema-enforced output and thinking.

    Args:
        model:         Ollama model string e.g. "devstral-small-2:24b"
        messages:      List of {role, content} dicts
        format_schema: Pass LLMOutput.model_json_schema() for schema-enforced JSON,
                       "json" for loose JSON mode, or None for plain text
        think:         True/False for most models; "low"/"medium"/"high" for gpt-oss
        timeout:       Request timeout in seconds

    Returns:
        {"content": str, "thinking": str | None}
    """
    headers = {"Content-Type": "application/json"}
    if OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3 if format_schema is None else 0.0},
    }

    if format_schema is not None:
        payload["format"] = format_schema  # dict = schema-enforced, "json" = loose

    if think is not None:
        payload["think"] = think  # bool or level string for gpt-oss

    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            headers=headers,
            json=payload,
            timeout=timeout,
        )
        response.raise_for_status()
        msg = response.json()["message"]
        return {
            "content": msg.get("content", ""),
            "thinking": msg.get("thinking"),  # None if model doesn't support it
        }
    except httpx.ConnectError:
        raise RuntimeError(
            f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. "
            "Check OLLAMA_BASE_URL and your internet/network."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise RuntimeError("Ollama API key invalid or missing. Check OLLAMA_API_KEY.")
        raise RuntimeError(f"Ollama API error {e.response.status_code}: {e.response.text}")


def gemini_analyze(state: DashboardState) -> dict:
    """Call Ollama analyze model with schema-enforced JSON output."""
    messages = [
        {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
        {"role": "user", "content": f"CSV Schema:\n{state['schema_summary']}"},
    ]

    result = _call_ollama(
        model=ANALYZE_MODEL,
        messages=messages,
        format_schema=LLMOutput.model_json_schema(),  # schema-enforced, not loose "json"
        think=None,  # no thinking for structured output — adds latency with no benefit
        timeout=180.0,
    )
    raw_text = result["content"]
    logger.info(f"Analyze response: {len(raw_text)} chars")
    return {"raw_llm_output": raw_text}


# ─────────────────────────────────────────────────────────────────────
# Node: validate_llm_output
# ─────────────────────────────────────────────────────────────────────
def validate_llm_output(state: DashboardState) -> dict:
    """Parse raw_llm_output with Pydantic. Set error on failure."""
    raw_text = state["raw_llm_output"].strip()
    
    # Robust JSON extraction: Find first { and last }
    start_idx = raw_text.find('{')
    end_idx = raw_text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        raw_text = raw_text[start_idx:end_idx + 1]
    else:
        # If no brackets found, it might be a complete failure (or we hope model_validate_json handles it)
        pass

    try:
        parsed = LLMOutput.model_validate_json(raw_text)
        return {
            "chart_configs": [c.model_dump() for c in parsed.charts],
            "filter_specs": [f.model_dump() for f in parsed.filters],
            "summary_text": parsed.summary,
            "error": None,
        }
    except (ValueError, Exception) as e:
        logger.warning(f"LLM output validation failed: {e}")
        return {
            "error": str(e),
            "chart_configs": [],
            "filter_specs": [],
            "summary_text": "Failed to parse dashboard components from the AI. You can still chat with your dataset."
        }


# ─────────────────────────────────────────────────────────────────────
# Node: retry
# ─────────────────────────────────────────────────────────────────────
def retry(state: DashboardState) -> dict:
    """Increment retry_count, clear error, loop back to analyze."""
    new_count = state.get("retry_count", 0) + 1
    logger.info(f"Retrying analysis (attempt {new_count})")
    return {"retry_count": new_count, "error": None}


# ─────────────────────────────────────────────────────────────────────
# Node: infer_filters
# ─────────────────────────────────────────────────────────────────────
def infer_filters(state: DashboardState) -> dict:
    """Enrich each filter spec with live values from the DataFrame."""
    df = state["df"]
    enriched = []

    for f in state["filter_specs"]:
        col = f["column"]
        if col not in df.columns:
            continue

        spec = dict(f)
        ft = spec["filterType"]

        if ft == "multiselect":
            spec["options"] = df[col].dropna().unique().tolist()
        elif ft == "slider":
            col_min = float(df[col].min())
            col_max = float(df[col].max())
            step = round((col_max - col_min) / 100, 2) if col_max != col_min else 1
            spec["min"] = col_min
            spec["max"] = col_max
            spec["step"] = step
        elif ft == "daterange":
            dates = pd.to_datetime(df[col], errors="coerce").dropna()
            if not dates.empty:
                spec["minDate"] = str(dates.min().date())
                spec["maxDate"] = str(dates.max().date())
        # toggle → no extra fields needed

        enriched.append(spec)

    return {"filter_specs": enriched}


# ─────────────────────────────────────────────────────────────────────
# Node: compute_aggregations
# ─────────────────────────────────────────────────────────────────────
def compute_aggregations(state: DashboardState) -> dict:
    """Run pandas aggregation for each chart config, attach data[]."""
    df = state["df"]
    chart_data = []

    for chart in state["chart_configs"]:
        try:
            x = chart["xAxis"]
            y = chart["yAxis"]
            agg = chart["aggregation"]

            if agg == "count":
                result = df[x].value_counts().reset_index()
                result.columns = ["label", "value"]
            elif agg in ("sum", "mean", "median"):
                result = df.groupby(x)[y].agg(agg).reset_index()
                result.columns = ["label", "value"]
            else:  # "none"
                result = df[[x, y]].dropna().rename(
                    columns={x: "label", y: "value"}
                )

            data = result.to_dict(orient="records")
            chart_with_data = dict(chart, data=data)
            chart_data.append(chart_with_data)
        except Exception as e:
            logger.warning(f"Skipping chart {chart.get('id')}: {e}")

    return {"chart_data": chart_data}


# ─────────────────────────────────────────────────────────────────────
# Node: assemble_payload
# ─────────────────────────────────────────────────────────────────────

def _clean_nan(obj):
    """
    Recursively replace NaN / Infinity floats with None so the
    result is JSON-serializable. Call on any dict/list derived
    from pandas before storing in state.
    """
    if isinstance(obj, list):
        return [_clean_nan(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj

def assemble_payload(state: DashboardState) -> dict:
    """Build the final dashboard payload dict."""
    max_rows = settings.MAX_RAW_ROWS
    payload = {
        "charts": state["chart_data"],
        "filters": state["filter_specs"],
        "summary": state["summary_text"],
        "rawData": state["df"].head(max_rows).to_dict(orient="records"),
        "meta": {
            "filename": state["filename"],
            "rowCount": state["row_count"],
            "columnCount": len(state["columns"]),
        },
    }
    
    cleaned_payload = _clean_nan(payload)
    logger.info(
        f"Dashboard payload assembled: {len(cleaned_payload['charts'])} charts, "
        f"{len(cleaned_payload['filters'])} filters"
    )
    return {"payload": cleaned_payload}


# ─────────────────────────────────────────────────────────────────────
# Node: check_chat_cache
# ─────────────────────────────────────────────────────────────────────
def check_chat_cache(state: DashboardState) -> dict:
    """Check if a similar question was already asked. Return cached answer if so."""
    question = state.get("user_question") or ""
    threshold = settings.CACHE_SIMILARITY_THRESHOLD
    history = state.get("chat_history") or []

    for i, msg in enumerate(history):
        if msg["role"] != "user":
            continue
        ratio = difflib.SequenceMatcher(None, question, msg["content"]).ratio()
        if ratio >= threshold:
            # Find the next assistant message
            if i + 1 < len(history) and history[i + 1]["role"] == "assistant":
                cached = history[i + 1]["content"]
                logger.info(f"Cache hit (similarity={ratio:.2f})")
                return {"chat_answer": f"[cached] {cached}"}

    return {}


# ─────────────────────────────────────────────────────────────────────
# Node: gemini_qa  (now uses Ollama)
# ─────────────────────────────────────────────────────────────────────
def gemini_qa(state: DashboardState) -> dict:
    """Multi-turn Q&A with full dashboard context via Ollama. Thinking enabled."""
    # Build lightweight context to avoid exceeding token limits
    light_charts = [{k: v for k, v in c.items() if k != "data"} for c in state["payload"]["charts"]]
    light_filters = []
    for f in state["payload"]["filters"]:
        lf = dict(f)
        if "options" in lf and isinstance(lf["options"], list) and len(lf["options"]) > 50:
            lf["options"] = lf["options"][:50] + [f"... {len(lf['options']) - 50} more items"]
        light_filters.append(lf)

    context_data = {
        "schema": state["schema_summary"],
        "dashboard": {
            "charts": light_charts,
            "filters": light_filters,
            "summary": state["payload"]["summary"],
        },
    }

    system_prompt = (
        "You are a data analyst assistant with full access to:\n"
        "1. The CSV schema (column names, types, statistics)\n"
        "2. The auto-generated dashboard (chart configs, filter definitions, summary)\n"
        "3. The full conversation history so far\n\n"
        "Answer the user's question concisely. Reference specific charts or filters when relevant.\n"
        "If you need to compute something not in the dashboard data, say so clearly.\n"
        "Never fabricate data that isn't in the schema or dashboard payload.\n\n"
        f"Context:\n{json.dumps(context_data, indent=2, default=str)}"
    )

    # Build message list: system → history → current question
    messages = [{"role": "system", "content": system_prompt}]

    for msg in (state.get("chat_history") or []):
        role = "assistant" if msg["role"] == "assistant" else "user"
        messages.append({"role": role, "content": msg["content"]})

    question = state["user_question"]
    messages.append({"role": "user", "content": question})

    result = _call_ollama(
        model=QA_MODEL,
        messages=messages,
        format_schema=None,  # natural language — no JSON enforcement
        think=True,          # reasoning trace enabled for better cross-referencing
        timeout=180.0,
    )

    # Only store content in history — never the thinking trace
    answer = result["content"]
    
    import re
    # Strip <think>...</think> tags if the model injected them into standard content
    answer = re.sub(r'<think>.*?</think>', '', answer, flags=re.DOTALL).strip()
    
    logger.info(f"QA answer: {len(answer)} chars")

    updated_history = list(state.get("chat_history") or [])
    updated_history.append({"role": "user", "content": question})
    updated_history.append({"role": "assistant", "content": answer})

    return {"chat_history": updated_history, "chat_answer": answer}
