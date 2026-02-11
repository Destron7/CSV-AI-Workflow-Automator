from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import numpy as np
from typing import Optional, List
import io

from statsmodels.tsa.statespace.sarimax import SARIMAX

router = APIRouter()


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


@router.post("/forecast")
@router.post("/forecast/")
async def forecast(
    file: UploadFile = File(...),
    date_col: str = Form(...),
    outcome: str = Form(...),
    treatments: Optional[str] = Form(None),
    steps: int = Form(12),
):
    # Read CSV from upload
    try:
        contents = await file.read()
        try:
            text = contents.decode("utf-8", errors="ignore")
            df = pd.read_csv(io.StringIO(text))
        except Exception:
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

    # Fit SARIMAX
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

    # Prepare future exogenous values by repeating the last observed row
    future_exog = None
    if exog is not None and len(exog_cols) > 0:
        last_row = exog.iloc[[-1]].to_numpy()
        future_exog = np.repeat(last_row, repeats=steps, axis=0)

    try:
        forecast_res = res.get_forecast(steps=steps, exog=future_exog)
        fc_mean = forecast_res.predicted_mean
        conf_int = forecast_res.conf_int(alpha=0.05)
        lower = conf_int.iloc[:, 0]
        upper = conf_int.iloc[:, 1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecast generation failed: {e}")

    # Dates
    dates_history = y.index.astype(str).tolist()
    if y.index.freqstr:
        future_index = pd.date_range(
            start=y.index[-1] + y.index.freq, periods=steps, freq=y.index.freq
        )
    else:
        diffs = y.index.to_series().diff().dropna()
        median_delta = diffs.median() if not diffs.empty else pd.Timedelta(days=1)
        future_index = pd.date_range(
            start=y.index[-1] + median_delta, periods=steps, freq=median_delta
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


"""
Deprecated: Forecasting endpoints have been removed.
This module is intentionally minimal to avoid import errors if referenced.
"""

from fastapi import APIRouter

router = APIRouter()
