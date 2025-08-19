"""
Cleaning service for handling CSV data cleaning operations
"""

from typing import Dict, Any
import logging
from fastapi import UploadFile
import pandas as pd
import io

from ..core.csv_processor import CSVProcessor
from ..core.exceptions import CSVProcessingError
from ..config import settings

logger = logging.getLogger(__name__)


class CleaningService:
    """Service for handling CSV cleaning operations"""

    def __init__(self):
        self.csv_processor = CSVProcessor()

    async def clean_csv_remove_nulls(self, file: UploadFile) -> Dict[str, Any]:
        """
        Clean a CSV file by removing rows with null values

        Args:
            file: Uploaded CSV file

        Returns:
            Dictionary containing:
            - cleaned_data: Preview of cleaned data
            - original_rows: Number of rows in original data
            - cleaned_rows: Number of rows in cleaned data
            - rows_removed: Number of rows removed
            - removal_percentage: Percentage of rows removed
            - columns: List of column names in data
            - cleaning_summary: Human-readable summary of cleaning operation

        Raises:
            CSVProcessingError: If file processing or cleaning fails
        """
        try:
            # Read file content
            content = await file.read()

            # Process original CSV file to DataFrame
            original_df = self.csv_processor.generate_df_from_csv(content)

            # Apply null row removal
            cleaned_df, cleaning_stats = self.csv_processor.remove_null_rows(
                original_df
            )

            # Convert column types (numeric and date)
            cleaned_df, type_conversion_stats = self.csv_processor.convert_column_types(
                cleaned_df
            )

            # Get preview of cleaned data
            preview_data = self.csv_processor.get_preview_data(
                cleaned_df, num_rows=settings.DEFAULT_PREVIEW_ROWS
            )

            # Build cleaning summary message
            cleaning_actions = []

            # Check if any rows were removed
            if cleaning_stats["rows_removed"] == 0:
                cleaning_actions.append("No rows with null values found.")
            else:
                cleaning_actions.append(
                    f"Removed {cleaning_stats['rows_removed']} rows containing null values ({cleaning_stats['removal_percentage']}%)."
                )

            # Check if any columns were converted to numeric
            if type_conversion_stats["numeric_conversions"] > 0:
                cleaning_actions.append(
                    f"Converted {type_conversion_stats['numeric_conversions']} column(s) to numeric format."
                )

            # Join all actions into a single summary
            if (
                len(cleaning_actions) == 1
                and cleaning_stats["rows_removed"] == 0
                and type_conversion_stats["numeric_conversions"] == 0
            ):
                cleaning_summary = "Data is already clean."
            else:
                cleaning_summary = " ".join(cleaning_actions)

            # Create response
            response = {
                "filename": file.filename,
                "cleaned_data": preview_data,
                "original_rows": cleaning_stats["rows_before"],
                "cleaned_rows": cleaning_stats["rows_after"],
                "rows_removed": cleaning_stats["rows_removed"],
                "removal_percentage": cleaning_stats["removal_percentage"],
                "columns": cleaned_df.columns.tolist(),
                "cleaning_summary": cleaning_summary,
                "type_conversions": {
                    "numeric_columns": type_conversion_stats["numeric_columns"],
                    "date_columns": type_conversion_stats["date_columns"],
                    "type_changes": type_conversion_stats["type_changes"],
                    "conversion_details": type_conversion_stats.get(
                        "conversion_details", {}
                    ),
                    "summary": type_conversion_stats.get("summary", ""),
                },
                # Include null data if rows were removed
                "null_data": (
                    {
                        "columns_with_nulls": cleaning_stats["columns_with_nulls"],
                        "null_counts_by_column": cleaning_stats[
                            "null_counts_by_column"
                        ],
                        "sample_removed_rows": cleaning_stats["sample_removed_rows"],
                    }
                    if cleaning_stats["rows_removed"] > 0
                    else None
                ),
            }

            if cleaning_stats["rows_removed"] == 0:
                logger.info(
                    f"CSV file {file.filename} is already clean - no rows with nulls found"
                )
            else:
                logger.info(
                    f"Successfully cleaned CSV file: {file.filename} - removed {cleaning_stats['rows_removed']} rows with nulls"
                )

            return response

        except Exception as e:
            logger.error(f"Failed to clean CSV file {file.filename}: {e}")
            raise CSVProcessingError(f"Failed to clean CSV file: {str(e)}")

    async def get_cleaned_csv_file(self, file: UploadFile) -> bytes:
        """
        Get a cleaned CSV file with null rows removed as downloadable bytes

        Args:
            file: Uploaded CSV file

        Returns:
            Bytes of the cleaned CSV file

        Raises:
            CSVProcessingError: If file processing or cleaning fails
        """
        try:
            # Read file content
            content = await file.read()

            # Process original CSV file to DataFrame
            original_df = self.csv_processor.generate_df_from_csv(content)

            # Apply null row removal
            cleaned_df, _ = self.csv_processor.remove_null_rows(original_df)

            # Convert column types (numeric and date)
            cleaned_df, _ = self.csv_processor.convert_column_types(cleaned_df)

            # Convert back to CSV bytes
            csv_buffer = io.StringIO()
            cleaned_df.to_csv(csv_buffer, index=False)
            csv_string = csv_buffer.getvalue()

            logger.info(f"Successfully generated cleaned CSV file: {file.filename}")
            return csv_string.encode("utf-8")

        except Exception as e:
            logger.error(f"Failed to generate cleaned CSV file {file.filename}: {e}")
            raise CSVProcessingError(f"Failed to generate cleaned CSV file: {str(e)}")
