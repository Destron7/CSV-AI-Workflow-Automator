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

    async def clean_csv_combined(
        self, file: UploadFile, remove_duplicates: bool = True
    ) -> Dict[str, Any]:
        """
        Clean a CSV file by removing null values and optionally removing duplicate rows

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

        Raises:
            CSVProcessingError: If file processing or cleaning fails
        """
        try:
            # Read file content
            content = await file.read()

            # Process original CSV file to DataFrame
            original_df = self.csv_processor.generate_df_from_csv(content)

            # Store original row count
            original_rows = len(original_df)

            # Apply null row removal
            cleaned_df, null_cleaning_stats = self.csv_processor.remove_null_rows(
                original_df
            )

            # Store intermediate stats
            rows_after_null_removal = len(cleaned_df)
            null_rows_removed = null_cleaning_stats["rows_removed"]

            # Apply duplicate row removal if requested
            duplicate_rows_removed = 0
            duplicate_rows_sample = []

            if remove_duplicates:
                # Remove duplicates
                cleaned_df, duplicate_cleaning_stats = (
                    self.csv_processor.remove_duplicate_rows(cleaned_df)
                )
                duplicate_rows_removed = duplicate_cleaning_stats["rows_removed"]
                duplicate_rows_sample = duplicate_cleaning_stats.get(
                    "duplicate_rows_sample", []
                )

            # Convert column types after all cleaning
            cleaned_df, type_conversion_stats = self.csv_processor.convert_column_types(
                cleaned_df
            )

            # Get preview of cleaned data
            preview_data = self.csv_processor.get_preview_data(
                cleaned_df, num_rows=settings.DEFAULT_PREVIEW_ROWS
            )

            # Calculate final statistics
            cleaned_rows = len(cleaned_df)
            total_rows_removed = original_rows - cleaned_rows
            removal_percentage = (
                round((total_rows_removed / original_rows * 100), 2)
                if original_rows > 0
                else 0
            )

            # Build cleaning summary message
            cleaning_actions = []

            # Add information about null rows
            if null_rows_removed == 0:
                cleaning_actions.append("No rows with null values found.")
            else:
                cleaning_actions.append(
                    f"Removed {null_rows_removed} rows containing null values."
                )

            # Add information about duplicate rows if applicable
            if remove_duplicates:
                if duplicate_rows_removed == 0:
                    cleaning_actions.append("No duplicate rows found.")
                else:
                    cleaning_actions.append(
                        f"Removed {duplicate_rows_removed} duplicate rows."
                    )

            # Check if any columns were converted to numeric
            if type_conversion_stats["numeric_conversions"] > 0:
                cleaning_actions.append(
                    f"Converted {type_conversion_stats['numeric_conversions']} column(s) to numeric format."
                )

            # Join all actions into a single summary
            if (
                len(cleaning_actions) == 1
                and total_rows_removed == 0
                and type_conversion_stats["numeric_conversions"] == 0
            ):
                cleaning_summary = "Data is already clean."
            else:
                cleaning_summary = " ".join(cleaning_actions)

            # Create response
            response = {
                "filename": file.filename,
                "cleaned_data": preview_data,
                "original_rows": original_rows,
                "cleaned_rows": cleaned_rows,
                "rows_removed": total_rows_removed,
                "removal_percentage": removal_percentage,
                "null_rows_removed": null_rows_removed,
                "duplicate_rows_removed": duplicate_rows_removed,
                "columns": cleaned_df.columns.tolist(),
                "cleaning_summary": cleaning_summary,
                "type_conversions": type_conversion_stats,
                "null_data": null_cleaning_stats,
                "duplicate_rows_sample": duplicate_rows_sample,
            }

            return response

        except Exception as e:
            logger.error(f"Error in combined CSV cleaning: {e}")
            raise CSVProcessingError(f"Failed to clean CSV: {str(e)}")

    async def get_combined_cleaned_csv_file(
        self, file: UploadFile, remove_duplicates: bool = True
    ) -> bytes:
        """
        Process a CSV file to remove null values and optionally duplicate rows and return as CSV bytes

        Args:
            file: Uploaded CSV file
            remove_duplicates: Whether to remove duplicate rows (default: True)

        Returns:
            bytes: CSV file content as bytes

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

            # Apply duplicate row removal if requested
            if remove_duplicates:
                cleaned_df, _ = self.csv_processor.remove_duplicate_rows(cleaned_df)

            # Convert cleaned DataFrame back to CSV bytes
            csv_buffer = io.StringIO()
            cleaned_df.to_csv(csv_buffer, index=False)
            csv_string = csv_buffer.getvalue()

            logger.info(
                f"Successfully generated combined cleaned CSV file: {file.filename}"
            )
            return csv_string.encode("utf-8")

        except Exception as e:
            logger.error(f"Error generating deduplicated CSV file: {e}")
            raise CSVProcessingError(f"Failed to generate deduplicated CSV: {str(e)}")
