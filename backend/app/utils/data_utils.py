"""
Data processing utilities
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Union, Optional
from datetime import datetime
import json


def convert_numpy_types(obj: Any) -> Any:
    """
    Convert numpy types to Python native types for JSON serialization

    Args:
        obj: Object that may contain numpy types

    Returns:
        Object with numpy types converted to native Python types
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj


def safe_json_serialize(obj: Any) -> str:
    """
    Safely serialize object to JSON, handling numpy types

    Args:
        obj: Object to serialize

    Returns:
        str: JSON string
    """
    converted_obj = convert_numpy_types(obj)
    return json.dumps(converted_obj, default=str, indent=2)


def normalize_column_names(columns: List[str]) -> List[str]:
    """
    Normalize column names for consistency

    Args:
        columns: List of column names

    Returns:
        List[str]: Normalized column names
    """
    normalized = []
    for col in columns:
        # Convert to lowercase and replace spaces/special chars with underscores
        clean_col = str(col).lower().strip()
        clean_col = clean_col.replace(" ", "_")
        clean_col = clean_col.replace("-", "_")
        # Remove special characters except underscores
        clean_col = "".join(c for c in clean_col if c.isalnum() or c == "_")
        # Remove multiple consecutive underscores
        while "__" in clean_col:
            clean_col = clean_col.replace("__", "_")
        # Remove leading/trailing underscores
        clean_col = clean_col.strip("_")
        normalized.append(clean_col)

    return normalized


def calculate_basic_stats(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """
    Calculate basic statistics for a column

    Args:
        df: pandas DataFrame
        column: Column name

    Returns:
        Dict with basic statistics
    """
    stats = {}
    series = df[column]

    stats["count"] = len(series)
    stats["null_count"] = series.isnull().sum()
    stats["null_percentage"] = (stats["null_count"] / stats["count"]) * 100
    stats["unique_count"] = series.nunique()
    stats["data_type"] = str(series.dtype)

    if pd.api.types.is_numeric_dtype(series):
        stats.update(
            {
                "mean": series.mean(),
                "median": series.median(),
                "std": series.std(),
                "min": series.min(),
                "max": series.max(),
                "q25": series.quantile(0.25),
                "q75": series.quantile(0.75),
            }
        )
    elif pd.api.types.is_datetime64_any_dtype(series):
        stats.update(
            {
                "min_date": series.min(),
                "max_date": series.max(),
            }
        )
    else:
        # Categorical/text data
        mode_values = series.mode()
        stats.update(
            {
                "mode": mode_values.iloc[0] if not mode_values.empty else None,
                "top_values": series.value_counts().head(5).to_dict(),
            }
        )

    return convert_numpy_types(stats)


def detect_column_types(df: pd.DataFrame) -> Dict[str, str]:
    """
    Detect the semantic type of each column

    Args:
        df: pandas DataFrame

    Returns:
        Dict mapping column names to detected types
    """
    column_types = {}

    for col in df.columns:
        series = df[col]

        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            column_types[col] = "datetime"
        # Check for numeric
        elif pd.api.types.is_numeric_dtype(series):
            if series.nunique() <= 10 and series.max() <= 10:
                column_types[col] = "categorical_numeric"
            else:
                column_types[col] = "numeric"
        # Check for boolean
        elif pd.api.types.is_bool_dtype(series):
            column_types[col] = "boolean"
        # Check for categorical text
        elif series.nunique() / len(series) < 0.5 and series.nunique() <= 50:
            column_types[col] = "categorical"
        else:
            column_types[col] = "text"

    return column_types


def memory_usage_mb(df: pd.DataFrame) -> float:
    """
    Calculate memory usage of DataFrame in MB

    Args:
        df: pandas DataFrame

    Returns:
        float: Memory usage in MB
    """
    return df.memory_usage(deep=True).sum() / 1024 / 1024
