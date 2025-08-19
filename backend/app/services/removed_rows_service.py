"""
CSV Cleaning Service - Endpoint for retrieving all removed rows
"""

from typing import Dict, Any
import pandas as pd
import numpy as np
import logging
import io

from ..core.csv_processor import CSVProcessor
from ..core.exceptions import CSVProcessingError
from ..config import settings

logger = logging.getLogger(__name__)


class AllRemovedRowsService:
    """Service for handling retrieval of all rows removed during cleaning"""

    def __init__(self):
        self.csv_processor = CSVProcessor()

    async def get_all_removed_rows(self, file_content: bytes) -> Dict[str, Any]:
        """
        Process a CSV file and get all rows that would be removed due to null values

        Args:
            file_content: Raw bytes of CSV file

        Returns:
            Dictionary with removed rows data
        """
        try:
            # Process original CSV file to DataFrame
            df = self.csv_processor.generate_df_from_csv(file_content)

            # Get null rows without actually removing them
            _, cleaning_stats = self.csv_processor.identify_null_rows(df)

            # Collect results
            result = {
                "removed_rows_count": cleaning_stats["rows_removed"],
                "removed_rows": cleaning_stats["sample_removed_rows"],
                "columns": df.columns.tolist(),
                "columns_with_nulls": cleaning_stats["columns_with_nulls"],
                "null_counts_by_column": cleaning_stats["null_counts_by_column"],
            }

            logger.info(
                f"Successfully identified {cleaning_stats['rows_removed']} rows with null values"
            )
            return result

        except Exception as e:
            logger.error(f"Failed to process CSV for removed rows: {e}")
            raise CSVProcessingError(f"Failed to process CSV: {str(e)}")
