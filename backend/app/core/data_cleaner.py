"""
Data cleaning utilities
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class DataCleaner:
    """Handle data cleaning operations"""

    @staticmethod
    def clean_dataframe(
        df: pd.DataFrame, config: Dict[str, Any] = None
    ) -> pd.DataFrame:
        """
        Clean the DataFrame based on configuration

        Args:
            df: pandas DataFrame to clean
            config: Configuration for cleaning operations

        Returns:
            Cleaned pandas DataFrame
        """
        if config is None:
            config = {}

        cleaned_df = df.copy()

        # Remove completely empty rows and columns
        cleaned_df = cleaned_df.dropna(how="all", axis=0)  # Remove empty rows
        cleaned_df = cleaned_df.dropna(how="all", axis=1)  # Remove empty columns

        # Handle missing values
        if config.get("fill_missing", True):
            cleaned_df = DataCleaner._handle_missing_values(cleaned_df)

        # Remove duplicates
        if config.get("remove_duplicates", True):
            initial_rows = len(cleaned_df)
            cleaned_df = cleaned_df.drop_duplicates()
            removed_duplicates = initial_rows - len(cleaned_df)
            if removed_duplicates > 0:
                logger.info(f"Removed {removed_duplicates} duplicate rows")

        # Clean column names
        if config.get("clean_column_names", True):
            cleaned_df = DataCleaner._clean_column_names(cleaned_df)

        logger.info(f"Data cleaning completed. Shape: {cleaned_df.shape}")
        return cleaned_df

    @staticmethod
    def _handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the DataFrame"""
        cleaned_df = df.copy()

        for col in cleaned_df.columns:
            if cleaned_df[col].dtype in ["int64", "float64"]:
                # For numeric columns, fill with median
                cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].median())
            else:
                # For non-numeric columns, fill with mode or 'Unknown'
                mode_value = cleaned_df[col].mode()
                if not mode_value.empty:
                    cleaned_df[col] = cleaned_df[col].fillna(mode_value[0])
                else:
                    cleaned_df[col] = cleaned_df[col].fillna("Unknown")

        return cleaned_df

    @staticmethod
    def _clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
        """Clean column names to be more standardized"""
        cleaned_df = df.copy()

        # Clean column names: lowercase, replace spaces with underscores
        new_columns = []
        for col in cleaned_df.columns:
            clean_col = str(col).lower().strip()
            clean_col = clean_col.replace(" ", "_")
            clean_col = clean_col.replace("-", "_")
            # Remove special characters except underscores
            clean_col = "".join(c for c in clean_col if c.isalnum() or c == "_")
            new_columns.append(clean_col)

        cleaned_df.columns = new_columns
        return cleaned_df

    @staticmethod
    def get_cleaning_summary(
        original_df: pd.DataFrame, cleaned_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Generate a summary of cleaning operations performed

        Args:
            original_df: Original DataFrame before cleaning
            cleaned_df: DataFrame after cleaning

        Returns:
            Dictionary containing cleaning summary
        """
        return {
            "original_shape": {
                "rows": original_df.shape[0],
                "columns": original_df.shape[1],
            },
            "cleaned_shape": {
                "rows": cleaned_df.shape[0],
                "columns": cleaned_df.shape[1],
            },
            "rows_removed": original_df.shape[0] - cleaned_df.shape[0],
            "columns_removed": original_df.shape[1] - cleaned_df.shape[1],
            "missing_values_handled": True,
            "duplicates_removed": True,
            "column_names_cleaned": True,
        }
