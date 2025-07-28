"""
Analysis service for handling CSV analysis business logic
"""

from typing import Dict, Any
import logging
from fastapi import UploadFile

from ..core.csv_processor import CSVProcessor
from ..core.exceptions import CSVProcessingError
from ..models.responses import ColumnInfo
from ..config import settings

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for handling CSV analysis operations"""

    def __init__(self):
        self.csv_processor = CSVProcessor()

    async def analyze_csv_comprehensive(self, file: UploadFile) -> Dict[str, Any]:
        """
        Comprehensive CSV analysis that returns both basic and detailed information

        Args:
            file: Uploaded CSV file

        Returns:
            Dictionary with comprehensive CSV analysis including:
            - Basic info (columns, rows, data preview)
            - Detailed metadata (file size, column statistics, type info)

        Raises:
            CSVProcessingError: If file processing fails
        """
        try:
            # Read file content
            content = await file.read()

            # Process CSV file
            df = self.csv_processor.generate_df_from_csv(content)

            # Get column information
            columns_info_raw = self.csv_processor.get_column_info(df)
            columns_info = [ColumnInfo(**col_info) for col_info in columns_info_raw]

            # Get preview data for both basic and detailed views
            preview_data_basic = self.csv_processor.get_preview_data(
                df, num_rows=settings.MAX_PREVIEW_ROWS
            )
            preview_data_detailed = self.csv_processor.get_preview_data(
                df, num_rows=settings.DEFAULT_PREVIEW_ROWS
            )

            # Create comprehensive response combining both basic and detailed info
            comprehensive_result = {
                # Basic information (for backward compatibility)
                "columns": df.columns.tolist(),
                "num_rows": len(df),
                "num_columns": len(df.columns),
                "data": preview_data_basic,
                # Detailed information from enhanced analysis
                "filename": file.filename,
                "file_size": len(content),
                "file_size_mb": round(len(content) / (1024 * 1024), 2),
                "columns_info": [
                    {
                        "name": col.name,
                        "data_type": col.data_type,
                        "null_count": col.null_count,
                        "unique_count": col.unique_count,
                        "sample_values": col.sample_values,
                    }
                    for col in columns_info
                ],
                "preview_data": preview_data_detailed,
            }

            logger.info(f"Successfully analyzed CSV file: {file.filename}")
            return comprehensive_result

        except Exception as e:
            logger.error(f"Failed to analyze CSV file {file.filename}: {e}")
            raise CSVProcessingError(f"Failed to analyze CSV file: {str(e)}")
