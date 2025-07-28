"""
CSV analysis endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import logging

from ...services.analysis_service import AnalysisService
from ...core.exceptions import CSVProcessingError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyse-csv/", response_model=dict)
async def analyze_csv(file: UploadFile = File(...)):
    """
    Analyze uploaded CSV file and return comprehensive information
    Uses unified analysis function that provides both basic and detailed information
    """
    try:
        analysis_service = AnalysisService()

        # Get comprehensive CSV analysis (includes both basic and detailed info)
        comprehensive_result = await analysis_service.analyze_csv_comprehensive(file)

        # Add additional metadata and insights
        total_missing_values = sum(
            col_info["null_count"] for col_info in comprehensive_result["columns_info"]
        )

        comprehensive_result["data_quality"] = {
            "total_missing_values": total_missing_values,
            "missing_percentage": round(
                (
                    total_missing_values
                    / (
                        comprehensive_result["num_rows"]
                        * comprehensive_result["num_columns"]
                    )
                )
                * 100,
                2,
            ),
            "has_missing_data": total_missing_values > 0,
        }

        comprehensive_result["column_types"] = {
            "numeric": len(
                [
                    col
                    for col in comprehensive_result["columns_info"]
                    if "int" in col["data_type"].lower()
                    or "float" in col["data_type"].lower()
                ]
            ),
            "text": len(
                [
                    col
                    for col in comprehensive_result["columns_info"]
                    if "object" in col["data_type"].lower()
                ]
            ),
            "other": len(
                [
                    col
                    for col in comprehensive_result["columns_info"]
                    if not (
                        "int" in col["data_type"].lower()
                        or "float" in col["data_type"].lower()
                        or "object" in col["data_type"].lower()
                    )
                ]
            ),
        }

        comprehensive_result["insights"] = {
            "ready_for_analysis": comprehensive_result["data_quality"][
                "missing_percentage"
            ]
            < 10,
            "recommended_actions": [],
        }

        # Add recommendations based on data quality
        if comprehensive_result["data_quality"]["missing_percentage"] > 5:
            comprehensive_result["insights"]["recommended_actions"].append(
                f"Consider handling missing values ({comprehensive_result['data_quality']['missing_percentage']:.1f}% of data is missing)"
            )

        if comprehensive_result["data_quality"]["missing_percentage"] == 0:
            comprehensive_result["insights"]["recommended_actions"].append(
                "Data quality is excellent - no missing values detected"
            )

        if comprehensive_result["num_rows"] > 10000:
            comprehensive_result["insights"]["recommended_actions"].append(
                "Large dataset detected - consider data sampling for initial exploration"
            )

        logger.info(
            f"Successfully analyzed CSV file: {file.filename} with {comprehensive_result['num_rows']} rows and {comprehensive_result['num_columns']} columns"
        )
        return comprehensive_result

    except CSVProcessingError as e:
        logger.error(f"CSV processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error analyzing CSV: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
