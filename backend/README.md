# CSV AI Workflow Automator - Backend

A FastAPI-based backend for AI-powered CSV data analysis and workflow automation.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration settings
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── api_v1.py           # API router aggregation
│   │   └── endpoints/
│   │       ├── __init__.py
│   │       ├── csv_analysis.py # CSV analysis endpoints
│   │       └── health.py       # Health check endpoints
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── csv_processor.py    # CSV processing logic
│   │   ├── data_cleaner.py     # Data cleaning utilities
│   │   └── exceptions.py       # Custom exceptions
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── requests.py         # Pydantic request models
│   │   └── responses.py        # Pydantic response models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── analysis_service.py # Business logic for analysis
│   │
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py       # File handling utilities
│       ├── logger.py           # Logging configuration
│       └── data_utils.py       # Data processing utilities
│
├── requirements.txt
├── run.py                      # Entry point script
├── .env.example               # Environment variables example
└── README.md
```

## Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment file:

```bash
cp .env.example .env
```

## Running the Application

### Development Mode

```bash
python run.py
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check

### CSV Analysis

- `POST /analyse-csv/` - Comprehensive CSV analysis with enhanced features
- `POST /api/v1/csv/analyse-csv/` - CSV analysis (new structure)

## Features

- **CSV File Analysis**: Upload and analyze CSV files
- **Data Cleaning**: Automatic data cleaning and preprocessing
- **Column Information**: Detailed statistics about each column
- **Data Preview**: Preview first few rows of data
- **Error Handling**: Comprehensive error handling and validation
- **API Documentation**: Automatic OpenAPI/Swagger documentation
- **CORS Support**: Cross-origin resource sharing for frontend integration

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

The application is structured following FastAPI best practices:

- **Separation of Concerns**: Business logic separated from API endpoints
- **Dependency Injection**: Clean dependency management
- **Pydantic Models**: Type validation for requests and responses
- **Error Handling**: Centralized exception handling
- **Configuration Management**: Environment-based configuration
- **Utility Functions**: Reusable helper functions for common tasks

### Utils Package

The `utils` package contains cross-cutting utility functions used throughout the application:

- **`file_utils.py`**: File validation, sanitization, and handling utilities
- **`logger.py`**: Logging configuration and helper functions
- **`data_utils.py`**: Data processing utilities for JSON serialization, statistics, and type detection

These utilities help maintain clean, DRY (Don't Repeat Yourself) code by providing reusable functions that multiple components can use.
