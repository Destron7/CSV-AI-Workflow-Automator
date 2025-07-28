"""
Logging configuration utilities
"""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(
    name: str,
    level: str = "INFO",
    log_file: Optional[str] = None,
    format_string: Optional[str] = None,
) -> logging.Logger:
    """
    Set up a logger with consistent formatting

    Args:
        name: Logger name
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        format_string: Custom format string

    Returns:
        logging.Logger: Configured logger
    """
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    formatter = logging.Formatter(format_string)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        # Create log directory if it doesn't exist
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def get_app_logger(name: str = "csv_ai_workflow") -> logging.Logger:
    """
    Get the main application logger with consistent configuration

    Args:
        name: Logger name

    Returns:
        logging.Logger: Application logger
    """
    return setup_logger(
        name=name,
        level="INFO",
        format_string="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
    )


class LoggerMixin:
    """
    Mixin class to add logging functionality to any class
    """

    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class"""
        return get_app_logger(f"{self.__class__.__module__}.{self.__class__.__name__}")


def log_function_call(func):
    """
    Decorator to log function calls with arguments and return values

    Usage:
        @log_function_call
        def my_function(arg1, arg2):
            return result
    """

    def wrapper(*args, **kwargs):
        logger = get_app_logger(func.__module__)
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")

        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} returned: {type(result).__name__}")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} raised {type(e).__name__}: {str(e)}")
            raise

    return wrapper
