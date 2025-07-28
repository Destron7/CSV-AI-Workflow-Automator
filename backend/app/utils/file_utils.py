"""
File handling utilities
"""

import os
import mimetypes
from typing import List, Tuple, Optional
from pathlib import Path


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Validate if file has an allowed extension

    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (e.g., ['.csv', '.xlsx'])

    Returns:
        bool: True if extension is allowed
    """
    file_extension = Path(filename).suffix.lower()
    return file_extension in [ext.lower() for ext in allowed_extensions]


def get_file_size_mb(file_size_bytes: int) -> float:
    """
    Convert file size from bytes to megabytes

    Args:
        file_size_bytes: File size in bytes

    Returns:
        float: File size in MB
    """
    return file_size_bytes / (1024 * 1024)


def is_file_size_valid(file_size_bytes: int, max_size_mb: int = 50) -> bool:
    """
    Check if file size is within allowed limits

    Args:
        file_size_bytes: File size in bytes
        max_size_mb: Maximum allowed size in MB

    Returns:
        bool: True if file size is valid
    """
    return get_file_size_mb(file_size_bytes) <= max_size_mb


def get_mime_type(filename: str) -> Optional[str]:
    """
    Get MIME type of a file based on its extension

    Args:
        filename: Name of the file

    Returns:
        Optional[str]: MIME type or None if unknown
    """
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing/replacing invalid characters

    Args:
        filename: Original filename

    Returns:
        str: Sanitized filename
    """
    # Remove or replace invalid characters
    invalid_chars = '<>:"/\\|?*'
    sanitized = filename

    for char in invalid_chars:
        sanitized = sanitized.replace(char, "_")

    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(" .")

    return sanitized


def create_unique_filename(base_filename: str, directory: str = None) -> str:
    """
    Create a unique filename by adding a counter if file already exists

    Args:
        base_filename: Base filename
        directory: Directory to check (optional)

    Returns:
        str: Unique filename
    """
    if directory is None:
        return base_filename

    file_path = Path(directory) / base_filename

    if not file_path.exists():
        return base_filename

    name_part = file_path.stem
    extension = file_path.suffix
    counter = 1

    while file_path.exists():
        new_name = f"{name_part}_{counter}{extension}"
        file_path = Path(directory) / new_name
        counter += 1

    return file_path.name
