"""Forecast endpoints: validate time series suitability, optionally clean, train SARIMAX, return forecasts with confidence intervals."""

from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import logging
import pandas as pd

from ...core.csv_processor import CSVProcessor
from ...services.forecast_service import ForecastService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/forecast/analyze/", response_model=dict)
async def forecast_analyze(
    file: UploadFile = File(...),
    target: str = Form(...),
    time_column: Optional[str] = Form(None),
    exogenous: Optional[str] = Form(None),  # comma-separated list
    horizon: int = Form(12),
    seasonal: bool = Form(True),
):
    """Validate dataset for forecasting and either return cleaning redirect info or forecasts.

    If cleaning is required (nulls, duplicates, missing columns) we respond with cleaning guidance.
    Otherwise we proceed to model training & forecasting directly.
    """
    try:
        csvprocessor = CSVProcessor()
        content = await file.read()
        df = csvprocessor.generate_df_from_csv(content)

        exog_list: Optional[List[str]] = None
        if exogenous:
            exog_list = [c.strip() for c in exogenous.split(",") if c.strip()]

        service = ForecastService()
        assessment = service.assess_cleaning_need(df, time_column, target, exog_list)
        if assessment["cleaning_needed"]:
            assessment.update(
                {
                    "message": "Cleaning required before forecasting. Redirect to cleaning endpoint.",
                    "suggested_endpoint": "/api/v1/csv/clean/remove-nulls/",
                    "suggested_params": {"remove_duplicates": True},
                }
            )
            return assessment

        # Proceed directly
        result = service.train_and_forecast(
            df,
            time_col=time_column,
            target=target,
            exogenous=exog_list,
            forecast_horizon=horizon,
            seasonal=seasonal,
        )
        result.update({"cleaning_needed": False})
        return result
    except Exception as e:
        logger.exception("Forecast analyze failed")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forecast/analyze-auto/", response_model=dict)
async def forecast_analyze_auto(
    file: UploadFile = File(...),
    target: str = Form(...),
    time_column: Optional[str] = Form(None),
    exogenous: Optional[str] = Form(None),
    horizon: int = Form(12),
    seasonal: bool = Form(True),
    remove_duplicates: bool = Form(True),
):
    """Auto-clean then forecast.

    Steps:
    1. Load CSV
    2. Remove null rows & duplicates if requested
    3. Convert types
    4. Train SARIMAX and return forecasts
    """
    try:
        csvprocessor = CSVProcessor()
        content = await file.read()
        df = csvprocessor.generate_df_from_csv(content)

        original_rows = len(df)
        null_rows_count = int(df.isna().any(axis=1).sum())
        duplicate_rows_count = int(df.duplicated().sum())

        cleaning_performed = False
        cleaned_df = df
        summary_parts = []

        if null_rows_count > 0:
            cleaned_df, null_stats = csvprocessor.remove_null_rows(cleaned_df)
            cleaning_performed = True
            summary_parts.append(
                f"Removed {null_stats.get('rows_removed', 0)} rows with nulls."
            )

        if remove_duplicates:
            dup_before = int(cleaned_df.duplicated().sum())
            if dup_before > 0:
                cleaned_df, dup_stats = csvprocessor.remove_duplicate_rows(cleaned_df)
                cleaning_performed = True
                summary_parts.append(
                    f"Removed {dup_stats.get('rows_removed', 0)} duplicate rows."
                )

        # Convert column types
        cleaned_df, type_conv_stats = csvprocessor.convert_column_types(cleaned_df)
        if type_conv_stats.get("numeric_conversions", 0) > 0:
            summary_parts.append(
                f"Converted {type_conv_stats.get('numeric_conversions',0)} column(s) to numeric."
            )

        cleaned_rows = len(cleaned_df)

        exog_list: Optional[List[str]] = None
        if exogenous:
            exog_list = [c.strip() for c in exogenous.split(",") if c.strip()]

        service = ForecastService()
        forecast_result = service.train_and_forecast(
            cleaned_df,
            time_col=time_column,
            target=target,
            exogenous=exog_list,
            forecast_horizon=horizon,
            seasonal=seasonal,
        )

        return {
            "cleaning_performed": cleaning_performed,
            "original_rows": original_rows,
            "cleaned_rows": cleaned_rows,
            "total_rows_removed": original_rows - cleaned_rows,
            "cleaning_summary": (
                " ".join(summary_parts)
                if summary_parts
                else (
                    "Data already clean."
                    if not cleaning_performed
                    else "Cleaning applied."
                )
            ),
            "forecast": forecast_result,
        }
    except Exception as e:
        logger.exception("Forecast analyze-auto failed")
        raise HTTPException(status_code=400, detail=str(e))
