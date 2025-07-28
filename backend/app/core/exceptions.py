"""
Custom exceptions for the application
"""


class CSVProcessingError(Exception):
    """Raised when CSV processing fails"""

    pass


class InvalidFileFormatError(Exception):
    """Raised when uploaded file is not in valid format"""

    pass


class DataCleaningError(Exception):
    """Raised when data cleaning operations fail"""

    pass


class CausalAnalysisError(Exception):
    """Raised when causal analysis fails"""

    pass


class WorkflowProcessingError(Exception):
    """Raised when workflow processing fails"""

    pass


class ConfigurationError(Exception):
    """Raised when configuration is invalid"""

    pass
