from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from typing import Optional, List
import io

# Import modular API v1 routers so one app serves all endpoints
from backend.app.api.api_v1 import api_router

# Lazy import inside function to reduce cold start cost if desired
from statsmodels.tsa.statespace.sarimax import SARIMAX

app = FastAPI(title="CSV AI Workflow API")

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Mount all versioned API routers under /api/v1
app.include_router(api_router, prefix="/api/v1")


def _ensure_datetime_index(df: pd.DataFrame, date_col: str) -> pd.DataFrame:
    if date_col not in df.columns:
        raise HTTPException(
            status_code=400, detail=f"date_col '{date_col}' not found in columns"
        )
    df = df.copy()
    try:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse date column: {e}")
    df = df.dropna(subset=[date_col])
    if df.empty:
        raise HTTPException(
            status_code=400, detail="No valid datetime values after parsing date_col"
        )
    df = df.set_index(date_col).sort_index()
    return df


def _coerce_numeric(df: pd.DataFrame, cols: List[str]) -> pd.DataFrame:
    df = df.copy()
    for c in cols:
        if c not in df.columns:
            raise HTTPException(
                status_code=400, detail=f"Column '{c}' not found in CSV"
            )
        df[c] = pd.to_numeric(df[c], errors="coerce")
    # Drop rows where outcome (and exog if present) are NaN
    df = df.dropna(subset=cols)
    if df.empty:
        raise HTTPException(
            status_code=400, detail="No valid rows after numeric coercion"
        )
    return df


# Forecasting under versioned API path
@app.post("/api/v1/forecast")
@app.post("/api/v1/forecast/")
async def forecast(
    file: UploadFile = File(...),
    date_col: str = Form(...),
    outcome: str = Form(...),
    treatments: Optional[str] = Form(None),
    steps: int = Form(12),
):
    try:
        contents = await file.read()
        # First try text decode
        try:
            text = contents.decode("utf-8", errors="ignore")
            df = pd.read_csv(io.StringIO(text))
        except Exception:
            # Fallback to binary buffer
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # Prepare dataframe
    df = _ensure_datetime_index(df, date_col)

    exog_cols: List[str] = []
    if treatments:
        exog_cols = [c.strip() for c in treatments.split(",") if c.strip()]

    cols_to_numeric = [outcome] + exog_cols
    df = _coerce_numeric(df, cols_to_numeric)

    y = df[outcome].astype(float)
    exog = df[exog_cols].astype(float) if exog_cols else None

    # Basic SARIMAX configuration; simple (1,1,1) with seasonal disabled by default
    # Users can refine later; for now provide a sensible default
    try:
        model = SARIMAX(
            y,
            order=(1, 1, 1),
            exog=exog,
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        res = model.fit(disp=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model fitting failed: {e}")

    # Future exogenous values: repeat last row if provided
    future_exog = None
    if exog is not None and len(exog_cols) > 0:
        last_row = exog.iloc[[-1]].to_numpy()
        future_exog = np.repeat(last_row, repeats=steps, axis=0)

    try:
        forecast_res = res.get_forecast(steps=steps, exog=future_exog)
        fc_mean = forecast_res.predicted_mean
        conf_int = forecast_res.conf_int(alpha=0.05)  # 95% CI
        lower = conf_int.iloc[:, 0]
        upper = conf_int.iloc[:, 1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecast generation failed: {e}")

    # Build date arrays
    dates_history = y.index.astype(str).tolist()

    # Normalize steps
    try:
        steps = int(steps)
    except Exception:
        steps = 12
    if steps < 1:
        steps = 1

    # Generate future dates using inferred frequency or positive median/mode delta
    if y.index.freq is not None:
        future_index = pd.date_range(
            start=y.index[-1] + y.index.freq, periods=steps, freq=y.index.freq
        )
    else:
        # Try to infer a string frequency first
        inferred = None
        try:
            inferred = pd.infer_freq(y.index)
        except Exception:
            inferred = None
        if inferred:
            from pandas.tseries.frequencies import to_offset

            offset = to_offset(inferred)
            future_index = pd.date_range(
                start=y.index[-1] + offset, periods=steps, freq=offset
            )
        else:
            # Use positive diffs only to avoid zero or negative delta
            diffs = y.index.to_series().diff().dropna()
            pos_diffs = diffs[diffs > pd.Timedelta(0)] if not diffs.empty else diffs
            if pos_diffs is not None and not pos_diffs.empty:
                # Prefer mode (most common step); fallback to median
                try:
                    delta = pos_diffs.mode().iloc[0]
                except Exception:
                    delta = pos_diffs.median()
                if delta <= pd.Timedelta(0):
                    delta = pd.Timedelta(days=1)
            else:
                delta = pd.Timedelta(days=1)
            future_index = pd.date_range(
                start=y.index[-1] + delta, periods=steps, freq=delta
            )
    dates_forecast = future_index.astype(str).tolist()

    return {
        "history": y.tolist(),
        "forecast": fc_mean.tolist(),
        "conf_int_lower": lower.tolist(),
        "conf_int_upper": upper.tolist(),
        "dates_history": dates_history,
        "dates_forecast": dates_forecast,
    }
