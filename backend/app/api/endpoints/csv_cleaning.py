"""
CSV Cleaning Endpoint - Specialized in removing rows with null values
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from fastapi.responses import StreamingResponse
import logging
import io

from ...services.cleaning_service import CleaningService
from ...services.removed_rows_service import AllRemovedRowsService
from ...core.exceptions import CSVProcessingError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/clean/remove-nulls/", response_model=dict)
async def clean_csv_remove_nulls(
    file: UploadFile = File(...), remove_duplicates: bool = True
):
    """
    Clean a CSV file by removing all rows containing null values and optionally removing duplicate rows

    Args:
        file: Uploaded CSV file
        remove_duplicates: Whether to remove duplicate rows (default: True)

    Returns:
        Dictionary containing:
        - cleaned_data: Preview of cleaned data
        - original_rows: Number of rows in original data
        - cleaned_rows: Number of rows in cleaned data
        - rows_removed: Number of rows removed
        - removal_percentage: Percentage of rows removed
        - columns: List of column names
        - cleaning_summary: Human-readable summary of cleaning operation
        - duplicate_rows_sample: Sample of duplicate rows that were removed (if any)
    """
    try:
        cleaning_service = CleaningService()

        # Process the cleaning request with combined functionality
        cleaning_result = await cleaning_service.clean_csv_combined(
            file, remove_duplicates
        )

        logger.info(
            f"Successfully cleaned CSV file (nulls and duplicates): {file.filename}"
        )
        return cleaning_result

    except CSVProcessingError as e:
        logger.error(f"CSV processing error during cleaning: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during CSV cleaning: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/clean/remove-nulls/download/")
async def download_cleaned_csv(
    file: UploadFile = File(...), remove_duplicates: bool = True
):
    """
    Clean a CSV file by removing all rows containing null values and optionally duplicate rows,
    then return it as a downloadable file

    Args:
        file: Uploaded CSV file
        remove_duplicates: Whether to remove duplicate rows (default: True)

    Returns:
        StreamingResponse with the cleaned CSV file for download
    """
    try:
        cleaning_service = CleaningService()

        # Generate cleaned CSV file as bytes using combined approach
        cleaned_csv_bytes = await cleaning_service.get_combined_cleaned_csv_file(
            file, remove_duplicates
        )

        # Prepare for download
        return StreamingResponse(
            io.BytesIO(cleaned_csv_bytes),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned_{file.filename}"
            },
        )

    except CSVProcessingError as e:
        logger.error(f"CSV processing error during cleaning for download: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during CSV cleaning for download: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/removed-rows/", response_model=dict)
async def get_all_removed_rows(file: UploadFile = File(...)):
    """
    Get all rows that would be removed from a CSV file due to null values

    Args:
        file: Uploaded CSV file

    Returns:
        Dictionary containing:
        - removed_rows_count: Number of rows with null values
        - removed_rows: List of all rows with null values
        - columns: List of column names
        - columns_with_nulls: List of columns that contain null values
        - null_counts_by_column: Dictionary mapping column names to their null counts
    """
    try:
        # Create the service
        removed_rows_service = AllRemovedRowsService()

        # Read file content
        content = await file.read()

        # Get all removed rows
        result = await removed_rows_service.get_all_removed_rows(content)

        logger.info(
            f"Successfully retrieved all removed rows for file: {file.filename}"
        )
        return result

    except CSVProcessingError as e:
        logger.error(f"CSV processing error retrieving removed rows: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error retrieving removed rows: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
