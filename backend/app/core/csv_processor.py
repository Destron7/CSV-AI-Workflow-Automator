"""
CSV processing and analysis utilities
"""

import pandas as pd
from typing import Dict, List, Any, Tuple
from io import StringIO
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
