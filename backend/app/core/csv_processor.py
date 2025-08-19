"""
CSV processing and analysis utilities
"""

import pandas as pd
import numpy as np
import csv
from typing import Dict, List, Any, Tuple, Optional
from io import StringIO, BytesIO
import logging

logger = logging.getLogger(__name__)


class CSVProcessor:
    """Handle CSV file processing and analysis"""

    @staticmethod
    def generate_df_from_csv(file_content: bytes) -> pd.DataFrame:
        """
        Process uploaded CSV file content into a pandas DataFrame

        Args:
            file_content: Raw bytes of the CSV file

        Returns:
            pandas.DataFrame: Processed CSV data

        Raises:
            ValueError: If file cannot be processed as CSV
        """
        try:
            # Decode bytes to string
            csv_string = file_content.decode("utf-8")

            # Create DataFrame from CSV string
            df = pd.read_csv(StringIO(csv_string))

            logger.info(f"Successfully processed CSV with shape: {df.shape}")
            return df

        except UnicodeDecodeError as e:
            logger.error(f"Failed to decode CSV file: {e}")
            raise ValueError(
                "File encoding not supported. Please use UTF-8 encoded CSV files."
            )
        except pd.errors.EmptyDataError as e:
            logger.error(f"Empty CSV file: {e}")
            raise ValueError("The CSV file appears to be empty.")
        except pd.errors.ParserError as e:
            logger.error(f"CSV parsing error: {e}")
            raise ValueError("Invalid CSV format. Please check your file structure.")
        except Exception as e:
            logger.error(f"Unexpected error processing CSV: {e}")
            raise ValueError(f"Failed to process CSV file: {str(e)}")

    @staticmethod
    def get_column_info(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Extract detailed information about each column

        Args:
            df: pandas DataFrame

        Returns:
            List of dictionaries containing column information
        """
        columns_info = []

        for col in df.columns:
            col_info = {
                "name": col,
                "data_type": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "sample_values": df[col].dropna().astype(str).head(3).tolist(),
            }
            columns_info.append(col_info)

        return columns_info

    @staticmethod
    def get_preview_data(df: pd.DataFrame, num_rows: int = 5) -> List[Dict[str, Any]]:
        """
        Get preview data from DataFrame

        Args:
            df: pandas DataFrame
            num_rows: Number of rows to preview

        Returns:
            List of dictionaries representing the preview data
        """
        # Ensure we don't request more rows than available
        num_rows = min(num_rows, len(df))

        # Convert to records and handle NaN values
        preview_data = df.head(num_rows).fillna("").to_dict(orient="records")

        # Convert all values to strings for consistent JSON serialization
        for row in preview_data:
            for key, value in row.items():
                row[key] = str(value) if pd.notna(value) else ""

        return preview_data

    @staticmethod
    def validate_columns_exist(
        df: pd.DataFrame, columns: List[str]
    ) -> Tuple[bool, List[str]]:
        """
        Validate that specified columns exist in the DataFrame

        Args:
            df: pandas DataFrame
            columns: List of column names to validate

        Returns:
            Tuple of (all_exist: bool, missing_columns: List[str])
        """
        missing_columns = [col for col in columns if col not in df.columns]
        return len(missing_columns) == 0, missing_columns

    @staticmethod
    def remove_null_rows(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Remove rows containing any null values from the DataFrame

        Args:
            df: pandas DataFrame to clean

        Returns:
            Tuple of (cleaned_df, cleaning_stats)
            - cleaned_df: DataFrame with null rows removed
            - cleaning_stats: Statistics about the cleaning operation
        """
        # Make a copy to avoid modifying the original
        df_cleaned = df.copy()

        # Get original shape
        rows_before = len(df_cleaned)

        # Track which columns had null values and which rows were removed
        null_counts = df_cleaned.isnull().sum()
        columns_with_nulls = null_counts[null_counts > 0].index.tolist()

        # Get row indices with null values before dropping
        rows_with_nulls = df_cleaned[df_cleaned.isnull().any(axis=1)].index.tolist()

        # Get all rows with nulls for display (full data and a sample)
        sample_rows_with_nulls = []
        if rows_with_nulls:
            # Take all rows for the complete dataset
            for idx in rows_with_nulls:
                row_data = df_cleaned.loc[idx].to_dict()
                # Mark null values in the sample
                for col, val in row_data.items():
                    if pd.isna(val):
                        row_data[col] = (
                            None  # Explicitly set to None for JSON serialization
                        )
                sample_rows_with_nulls.append({"row_index": int(idx), "data": row_data})

        # Drop rows with any NA values
        df_cleaned = df_cleaned.dropna()

        # Calculate cleaning stats
        rows_after = len(df_cleaned)
        rows_removed = rows_before - rows_after
        removal_percentage = (
            (rows_removed / rows_before * 100) if rows_before > 0 else 0
        )

        # Compile cleaning statistics
        cleaning_stats = {
            "rows_before": rows_before,
            "rows_after": rows_after,
            "rows_removed": rows_removed,
            "removal_percentage": round(removal_percentage, 2),
            "columns_count": len(df_cleaned.columns),
            "columns_with_nulls": columns_with_nulls,
            "null_counts_by_column": null_counts.to_dict(),
            "sample_removed_rows": sample_rows_with_nulls,
        }

        logger.info(
            f"Removed {rows_removed} rows containing null values ({round(removal_percentage, 2)}%)"
        )
        return df_cleaned, cleaning_stats

    @staticmethod
    def identify_null_rows(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Identify rows containing any null values in the DataFrame without removing them

        Args:
            df: pandas DataFrame to analyze

        Returns:
            Tuple of (df, stats)
            - df: Original DataFrame (unchanged)
            - stats: Statistics about null rows
        """
        # Make a copy to avoid modifying the original
        df_copy = df.copy()

        # Get original shape
        rows_before = len(df_copy)

        # Track which columns had null values and which rows were removed
        null_counts = df_copy.isnull().sum()
        columns_with_nulls = null_counts[null_counts > 0].index.tolist()

        # Get row indices with null values
        null_mask = df_copy.isnull().any(axis=1)
        rows_with_nulls = df_copy[null_mask].index.tolist()

        # Get all rows with nulls for display
        all_rows_with_nulls = []
        if rows_with_nulls:
            for idx in rows_with_nulls:
                row_data = df_copy.loc[idx].to_dict()
                # Mark null values in the data
                for col, val in row_data.items():
                    if pd.isna(val):
                        row_data[col] = (
                            None  # Explicitly set to None for JSON serialization
                        )
                all_rows_with_nulls.append({"row_index": int(idx), "data": row_data})

        # Calculate stats
        rows_removed = len(rows_with_nulls)
        removal_percentage = (
            (rows_removed / rows_before * 100) if rows_before > 0 else 0
        )

        # Compile statistics
        cleaning_stats = {
            "rows_before": rows_before,
            "rows_after": rows_before - rows_removed,
            "rows_removed": rows_removed,
            "removal_percentage": round(removal_percentage, 2),
            "columns_count": len(df_copy.columns),
            "columns_with_nulls": columns_with_nulls,
            "null_counts_by_column": null_counts.to_dict(),
            "sample_removed_rows": all_rows_with_nulls,
        }

        logger.info(
            f"Identified {rows_removed} rows containing null values ({round(removal_percentage, 2)}%)"
        )
        return df_copy, cleaning_stats

    @staticmethod
    def convert_column_types(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Convert columns to appropriate types based on content, with emphasis on numeric conversion.

        This method will:
        1. Identify columns containing numeric data but stored as strings or objects
        2. Convert those columns to numeric types if at least 80% of values can be converted
        3. Preserve specific columns that should remain as strings even if they look numeric
           (like IDs, zip codes, phone numbers)

        Args:
            df: pandas DataFrame to process

        Returns:
            Tuple of (processed_df, conversion_stats)
            - processed_df: DataFrame with converted column types
            - conversion_stats: Statistics about the conversions including before/after types
        """
        # Make a copy to avoid modifying the original
        df_converted = df.copy()

        # Track conversions for reporting
        conversions = {
            "numeric_columns": [],
            "date_columns": [],  # Keeping this key for compatibility with frontend, but it will be empty
            "original_types": {},
            "new_types": {},
            "conversion_details": {},  # New field with detailed info about each conversion
        }

        # Record original types
        for col in df_converted.columns:
            conversions["original_types"][col] = str(df_converted[col].dtype)

        # Columns that should not be converted even if they look numeric
        exclude_patterns = [
            "id",
            "code",
            "phone",
            "zip",
            "postal",
            "year",
            "ssn",
            "identifier",
            "password",
        ]

        # Function to check if a column should be excluded from conversion
        def should_exclude(col_name):
            col_lower = col_name.lower()
            return any(pattern in col_lower for pattern in exclude_patterns)

        # Function to check if a value can be converted to numeric
        def is_numeric_value(val):
            # Handle null values
            if pd.isna(val) or val == "":
                return pd.NA

            # Convert to string for cleaning
            val_str = str(val).strip()

            # Clean common number formatting
            val_clean = (
                val_str.replace(",", "")  # Remove thousands separators
                .replace("$", "")  # Remove dollar signs
                .replace("%", "")  # Remove percent signs
                .replace("−", "-")  # Replace unicode minus with standard minus
            )

            # Try converting to float
            try:
                return float(val_clean)
            except:
                return pd.NA

        # Attempt numeric conversions for each column
        for col in df_converted.columns:
            # Skip columns that are already numeric
            if pd.api.types.is_numeric_dtype(df_converted[col]):
                continue

            # Skip columns that shouldn't be converted based on name
            if should_exclude(col):
                logger.debug(f"Skipping column '{col}' based on name pattern")
                continue

            # Only process string or object columns
            if not (
                pd.api.types.is_string_dtype(df_converted[col])
                or pd.api.types.is_object_dtype(df_converted[col])
            ):
                continue

            try:
                # Apply numeric conversion with coercion to the column
                original_values = df_converted[col].copy()

                # Try to convert each value and count success rate
                numeric_values = original_values.apply(is_numeric_value)
                success_rate = numeric_values.notna().mean()

                # Only convert if 80% or more values can be converted successfully
                if success_rate >= 0.8:
                    # Apply the actual conversion to the DataFrame
                    clean_series = (
                        df_converted[col]
                        .astype(str)
                        .str.replace("$", "", regex=False)
                        .str.replace("%", "", regex=False)
                        .str.replace(",", "", regex=False)
                        .str.replace("−", "-", regex=False)  # Unicode minus
                    )

                    # Convert to numeric with coercion
                    numeric_series = pd.to_numeric(clean_series, errors="coerce")

                    # Record detailed stats about this conversion
                    conversion_detail = {
                        "original_type": str(df_converted[col].dtype),
                        "new_type": str(numeric_series.dtype),
                        "success_rate": float(success_rate),
                        "values_before_conversion": len(original_values),
                        "valid_numeric_values": int(numeric_series.notna().sum()),
                        "null_values_after": int(numeric_series.isna().sum()),
                    }

                    # Apply the conversion
                    df_converted[col] = numeric_series

                    # Record the conversion
                    conversions["numeric_columns"].append(col)
                    conversions["conversion_details"][col] = conversion_detail

                    logger.info(
                        f"Converted column '{col}' to numeric type with {success_rate:.1%} success rate"
                    )
            except Exception as e:
                logger.debug(f"Error converting column '{col}' to numeric: {e}")

        # Record new types after all conversions
        for col in df_converted.columns:
            conversions["new_types"][col] = str(df_converted[col].dtype)

        # Generate summary statistics
        conversion_stats = {
            "numeric_conversions": len(conversions["numeric_columns"]),
            "date_conversions": 0,  # Always 0 since we're not doing date conversions
            "numeric_columns": conversions["numeric_columns"],
            "date_columns": [],  # Empty list since we're not doing date conversions
            "type_changes": {
                col: {
                    "from": conversions["original_types"][col],
                    "to": conversions["new_types"][col],
                }
                for col in conversions["numeric_columns"]
            },
            "conversion_details": conversions.get("conversion_details", {}),
        }

        # Add a human-readable summary of the conversions
        if conversion_stats["numeric_conversions"] > 0:
            column_summary = ", ".join(
                [f"'{col}'" for col in conversions["numeric_columns"][:3]]
            )
            if len(conversions["numeric_columns"]) > 3:
                column_summary += f" and {len(conversions['numeric_columns']) - 3} more"

            conversion_stats["summary"] = (
                f"Converted {len(conversions['numeric_columns'])} columns to numeric type: {column_summary}"
            )
        else:
            conversion_stats["summary"] = "No columns were converted to numeric type"

        logger.info(
            f"Converted {len(conversions['numeric_columns'])} columns to numeric"
        )
        return df_converted, conversion_stats
