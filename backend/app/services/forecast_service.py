"""Forecasting service: validates time series, optional exogenous (treatments), trains SARIMAX and forecasts with confidence intervals."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
import logging
from statsmodels.tsa.statespace.sarimax import SARIMAX

logger = logging.getLogger(__name__)


class ForecastService:
    """Service to perform SARIMAX forecasting.

    Assumptions:
    - A time column is provided (name configurable) or infer first datetime-like column.
    - Outcome (target) column provided.
    - Optional treatment columns passed as exogenous regressors (xvars) to SARIMAX.
    - Basic automatic order / seasonal_order selection kept simple to avoid long grid-search (O/AIC based heuristic).
    """

    def __init__(self):
        pass

    def _infer_time_column(self, df: pd.DataFrame, time_col: Optional[str]) -> str:
        if time_col and time_col in df.columns:
            return time_col
        # Try to detect a datetime-like column
        for c in df.columns:
            if np.issubdtype(df[c].dtype, np.datetime64):
                return c
        # Attempt to parse any column with typical time keywords
        for c in df.columns:
            lc = c.lower()
            if any(k in lc for k in ["date", "time", "timestamp"]):
                try:
                    pd.to_datetime(df[c])
                    return c
                except Exception:
                    continue
        raise ValueError("No valid time column found or specified.")

    def _coerce_numeric(self, df: pd.DataFrame, cols: List[str]) -> pd.DataFrame:
        out = df.copy()
        for c in cols:
            out[c] = pd.to_numeric(out[c], errors="coerce")
        return out

    def _basic_clean(self, df: pd.DataFrame) -> pd.DataFrame:
        # Drop fully empty columns
        df2 = df.dropna(axis=1, how="all")
        # Forward fill then back fill small gaps (light touch)
        return df2.ffill().bfill()

    def _auto_orders(
        self, y: pd.Series, seasonal: bool, freq: Optional[str]
    ) -> Tuple[Tuple[int, int, int], Tuple[int, int, int, int]]:
        # Minimal heuristic: difference order d determined by stationarity (ADF idea proxy via variance change)
        d = 1 if y.diff().abs().mean() < y.abs().mean() * 0.9 else 0
        # p,q small defaults
        p = 1
        q = 1
        order = (p, d, q)
        if seasonal and freq:
            # Guess period
            period_map = {"D": 7, "H": 24, "M": 12, "Q": 4}
            key = freq[0].upper()
            m = period_map.get(key, 0)
            if m >= 2 and len(y) > m * 2:
                P = 1
                D = 1
                Q = 1
                return order, (P, D, Q, m)
        return order, (0, 0, 0, 0)

    def assess_cleaning_need(
        self,
        df: pd.DataFrame,
        time_col: Optional[str],
        target: str,
        exogenous: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        issues: List[str] = []
        try:
            tcol = self._infer_time_column(df, time_col)
        except Exception as e:
            issues.append(str(e))
            tcol = time_col or ""
        if target not in df.columns:
            issues.append("Target column missing.")
        else:
            # Check numeric coercion viability for target
            tgt_numeric = pd.to_numeric(df[target], errors="coerce")
            valid_ratio = float(tgt_numeric.notna().sum()) / max(1, len(tgt_numeric))
            if valid_ratio < 0.8:
                issues.append(
                    f"Target column '{target}' not mostly numeric (only {valid_ratio:.0%} convertible)."
                )
        if exogenous:
            missing = [c for c in exogenous if c not in df.columns]
            if missing:
                issues.append(f"Missing exogenous columns: {missing}")
            # Exogenous numeric viability
            numeric_problem_cols = []
            for c in exogenous:
                if c in df.columns:
                    conv = pd.to_numeric(df[c], errors="coerce")
                    ratio = float(conv.notna().sum()) / max(1, len(conv))
                    if ratio < 0.6:
                        numeric_problem_cols.append(f"{c} ({ratio:.0%} numeric)")
            if numeric_problem_cols:
                issues.append(
                    "Exogenous columns weakly numeric: "
                    + ", ".join(numeric_problem_cols)
                )
        null_rows = int(df.isna().any(axis=1).sum())
        duplicate_rows = int(df.duplicated().sum())
        if null_rows > 0:
            issues.append(f"{null_rows} rows contain nulls")
        if duplicate_rows > 0:
            issues.append(f"{duplicate_rows} duplicate rows found")
        cleaning_needed = len(issues) > 0
        return {
            "cleaning_needed": cleaning_needed,
            "issues": issues,
            "null_rows_count": null_rows,
            "duplicate_rows_count": duplicate_rows,
            "time_column": tcol,
            "columns": df.columns.tolist(),
        }

    def train_and_forecast(
        self,
        df: pd.DataFrame,
        time_col: Optional[str],
        target: str,
        exogenous: Optional[List[str]] = None,
        forecast_horizon: int = 12,
        seasonal: bool = True,
    ) -> Dict[str, Any]:
        # Validate / infer time column
        tcol = self._infer_time_column(df, time_col)
        df2 = df.copy()
        # Parse datetime
        if not np.issubdtype(df2[tcol].dtype, np.datetime64):
            df2[tcol] = pd.to_datetime(df2[tcol], errors="coerce")
        df2 = df2.dropna(subset=[tcol])
        df2 = df2.sort_values(tcol)
        # Basic clean for numeric columns of interest
        cols_needed = [target] + [c for c in (exogenous or [])]
        df2 = self._coerce_numeric(df2, cols_needed)
        df2 = self._basic_clean(df2)
        # Set index
        df2 = df2.set_index(tcol)
        # Force numeric target
        y = pd.to_numeric(df2[target], errors="coerce")
        # Prepare exogenous
        exog_train = None
        kept_exog: List[str] = []
        dropped_exog: List[str] = []
        if exogenous:
            exog_num = df2[exogenous].apply(lambda s: pd.to_numeric(s, errors="coerce"))
            for c in exog_num.columns:
                valid_ratio = float(exog_num[c].notna().sum()) / max(1, len(exog_num))
                if valid_ratio < 0.5:
                    dropped_exog.append(c)
                else:
                    kept_exog.append(c)
            if kept_exog:
                exog_train = exog_num[kept_exog]
        # Ensure y float64
        y = y.astype("float64")
        if exog_train is not None:
            exog_train = exog_train.astype("float64")
        # Drop rows with missing y or exog
        if exog_train is not None:
            mask = y.notna()
            for c in exog_train.columns:
                mask &= exog_train[c].notna()
            y = y[mask]
            exog_train = exog_train.loc[mask]
        else:
            y = y.dropna()
        if y.empty or len(y) < 10:
            raise ValueError(
                "Not enough valid numeric observations for forecasting after cleaning."
            )
        if exog_train is not None and len(exog_train) != len(y):
            raise ValueError(
                "Misalignment between target and exogenous after cleaning."
            )
        # Detect frequency (pandas infers; fallback no seasonality)
        try:
            inferred_freq = pd.infer_freq(y.index)
        except Exception:
            inferred_freq = None

        order, seasonal_order = self._auto_orders(y, seasonal, inferred_freq)

        try:
            model = SARIMAX(
                y,
                order=order,
                seasonal_order=seasonal_order,
                exog=exog_train,
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            fitted = model.fit(disp=False)
        except ValueError as ve:
            msg = str(ve)
            if "Pandas data cast to numpy dtype of object" in msg:
                raise ValueError(
                    "Data casting error: One or more series still non-numeric after cleaning. "
                    "Verify target and exogenous columns are numeric. Dropped exogenous: "
                    f"{dropped_exog}. Kept exogenous: {kept_exog}."
                ) from ve
            raise

        # Future exogenous: naive hold last value
        exog_future = None
        if exog_train is not None and kept_exog:
            last_vals = exog_train.iloc[-1]
            exog_future = pd.DataFrame(
                [last_vals.values] * forecast_horizon, columns=kept_exog
            )

        forecast_res = fitted.get_forecast(steps=forecast_horizon, exog=exog_future)
        pred_mean = forecast_res.predicted_mean
        conf_int = forecast_res.conf_int()
        # Build output rows
        idx = pred_mean.index
        predictions = []
        for i, ts in enumerate(idx):
            lower = conf_int.iloc[i, 0]
            upper = conf_int.iloc[i, 1]
            predictions.append(
                {
                    "timestamp": (
                        ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
                    ),
                    "forecast": float(pred_mean.iloc[i]),
                    "lower_ci": float(lower),
                    "upper_ci": float(upper),
                }
            )

        # Historical (training) actual series for plotting alongside forecast
        history = [
            {
                "timestamp": (ix.isoformat() if hasattr(ix, "isoformat") else str(ix)),
                "actual": float(y.loc[ix]) if pd.notna(y.loc[ix]) else None,
            }
            for ix in y.index
        ]

        return {
            "model": {
                "order": order,
                "seasonal_order": seasonal_order,
                "aic": float(getattr(fitted, "aic", np.nan)),
                "bic": float(getattr(fitted, "bic", np.nan)),
                "n_obs": int(fitted.nobs),
                "freq": inferred_freq,
            },
            "training": {
                "start": (
                    y.index.min().isoformat()
                    if hasattr(y.index.min(), "isoformat")
                    else str(y.index.min())
                ),
                "end": (
                    y.index.max().isoformat()
                    if hasattr(y.index.max(), "isoformat")
                    else str(y.index.max())
                ),
                "target_mean": float(y.mean()),
                "target_std": float(y.std(ddof=1)) if y.std(ddof=1) else None,
            },
            "predictions": predictions,
            "history": history,
            "exogenous": kept_exog,
            "dropped_exogenous": dropped_exog,
        }
