"""
Causal analysis endpoint: accepts CSV upload plus treatment/outcome, returns learned graph and effect estimate.
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import logging

from ...services.causal_service import CausalService
from ...core.exceptions import CSVProcessingError
from ...core.csv_processor import CSVProcessor

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/causal/analyze/", response_model=dict)
async def causal_analyze(
    file: UploadFile = File(...),
    treatment: str = Form(...),
    outcome: str = Form(...),
    alpha: float = Form(0.05),
    estimator: Optional[str] = Form(None),
):
    try:
        csvprocessor = CSVProcessor()
        content = await file.read()
        # Read CSV into DataFrame using shared CSVProcessor (expects bytes)
        df = csvprocessor.generate_df_from_csv(content)

        # Pre-cleaning check: any nulls or duplicate rows?
        null_rows_count = int(df.isna().any(axis=1).sum())
        duplicate_rows_count = int(df.duplicated().sum())
        cleaning_needed = (null_rows_count > 0) or (duplicate_rows_count > 0)

        if cleaning_needed:
            # Return guidance to use cleaning endpoint; clients can redirect UI/workflow
            return {
                "cleaning_needed": True,
                "null_rows_count": null_rows_count,
                "duplicate_rows_count": duplicate_rows_count,
                "message": "Cleaning required before causal analysis. Redirect to cleaning endpoint.",
                "suggested_endpoint": "/api/v1/csv/clean/remove-nulls/",
                "suggested_params": {"remove_duplicates": True},
                "columns": df.columns.tolist(),
            }

        # Proceed with causal analysis
        service = CausalService()
        result = service.run(df, treatment=treatment, outcome=outcome, alpha=alpha, estimator=estimator)
        # Attach cleanliness metadata
        result.update({
            "cleaning_needed": False,
            "null_rows_count": null_rows_count,
            "duplicate_rows_count": duplicate_rows_count,
        })
        return result
    except Exception as e:
        logger.exception("Causal analysis failed")
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/causal/analyze-auto/", response_model=dict)
async def causal_analyze_auto(
    file: UploadFile = File(...),
    treatment: str = Form(...),
    outcome: str = Form(...),
    alpha: float = Form(0.05),
    remove_duplicates: bool = Form(True),
    estimator: Optional[str] = Form(None),
):
    """
    Helper endpoint: accepts a CSV once, cleans if needed, then runs causal analysis.
    Returns a combined response with cleaning metadata and causal results.
    """
    try:
        csvprocessor = CSVProcessor()
        content = await file.read()
        df = csvprocessor.generate_df_from_csv(content)

        original_rows = int(len(df))
        null_rows_count = int(df.isna().any(axis=1).sum())
        duplicate_rows_count = int(df.duplicated().sum())

        cleaning_performed = False
        cleaning_info = {
            "original_rows": original_rows,
            "null_rows_count": null_rows_count,
            "duplicate_rows_count": duplicate_rows_count,
        }

        cleaned_df = df
        cleaning_summary_parts = []

        # Clean null rows if present
        if null_rows_count > 0:
            cleaned_df, null_stats = csvprocessor.remove_null_rows(cleaned_df)
            cleaning_performed = True
            cleaning_info.update({
                "null_rows_removed": null_stats.get("rows_removed", 0),
                "null_removal_percentage": null_stats.get("removal_percentage", 0),
            })
            cleaning_summary_parts.append(
                f"Removed {null_stats.get('rows_removed', 0)} rows with nulls."
            )

        # Remove duplicates if requested and present
        if remove_duplicates:
            dup_count_before = int(cleaned_df.duplicated().sum())
            if dup_count_before > 0:
                cleaned_df, dup_stats = csvprocessor.remove_duplicate_rows(cleaned_df)
                cleaning_performed = True
                cleaning_info.update({
                    "duplicate_rows_removed": dup_stats.get("rows_removed", 0),
                    "duplicate_removal_percentage": dup_stats.get("removal_percentage", 0),
                })
                cleaning_summary_parts.append(
                    f"Removed {dup_stats.get('rows_removed', 0)} duplicate rows."
                )

        # Convert types after cleaning (optional enrichment for downstream analysis)
        cleaned_df, type_conv_stats = csvprocessor.convert_column_types(cleaned_df)
        if type_conv_stats.get("numeric_conversions", 0) > 0:
            cleaning_summary_parts.append(
                f"Converted {type_conv_stats.get('numeric_conversions', 0)} column(s) to numeric."
            )

        cleaned_rows = int(len(cleaned_df))
        cleaning_info.update({
            "cleaned_rows": cleaned_rows,
            "total_rows_removed": original_rows - cleaned_rows,
            "cleaning_summary": " ".join(cleaning_summary_parts) if cleaning_summary_parts else (
                "Data already clean." if not cleaning_performed else "Cleaning applied."
            )
        })

        # Validate treatment/outcome still exist
        if treatment not in cleaned_df.columns or outcome not in cleaned_df.columns:
            raise HTTPException(status_code=400, detail="Treatment or outcome column not found after cleaning.")

        # Run causal analysis
        service = CausalService()
        causal_result = service.run(cleaned_df, treatment=treatment, outcome=outcome, alpha=alpha, estimator=estimator)

        return {
            "cleaning_performed": cleaning_performed,
            **cleaning_info,
            "columns": cleaned_df.columns.tolist(),
            "causal": causal_result,
        }
    except Exception as e:
        logger.exception("Auto causal analysis failed")
        raise HTTPException(status_code=400, detail=str(e))
