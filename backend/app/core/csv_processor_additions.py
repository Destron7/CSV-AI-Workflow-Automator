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
                        row_data[col] = None  # Explicitly set to None for JSON serialization
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
            "sample_removed_rows": all_rows_with_nulls
        }
        
        logger.info(
            f"Identified {rows_removed} rows containing null values ({round(removal_percentage, 2)}%)"
        )
        return df_copy, cleaning_stats
