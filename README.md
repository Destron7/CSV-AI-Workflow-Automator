# CSV AI Workflow Automator

A comprehensive solution for AI-powered CSV data analysis, cleaning, and workflow automation. This project consists of a FastAPI backend for data processing and a React frontend for user interaction.

![CSV AI Workflow Automator](./frontend/public/logo192.png)

## Project Overview

The CSV AI Workflow Automator is designed to streamline the process of analyzing, cleaning, and visualizing CSV data. The application provides an intuitive interface for uploading CSV files, performing data quality checks, cleaning data, and visualizing insights.

### Key Features

- **CSV Analysis**: Detailed statistical analysis of CSV files including data types, missing values, and outliers
- **Data Cleaning**: Automated cleaning of CSV data with options for handling null values and type conversion
- **Data Visualization**: Interactive charts and graphs for data quality assessment and insights
- **Type Conversion**: Intelligent conversion of string columns to appropriate numeric types when possible
- **Removed Rows View**: Ability to view and analyze rows removed during the cleaning process
- **Workflow Automation**: Streamlined workflow for data preparation and analysis

## Project Structure

```
CSV AI Workflow/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core data processing logic
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Utility functions
│   ├── requirements.txt
│   └── run.py             # Entry point script
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── charts/    # Visualization components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Technology Stack

### Backend

- **FastAPI**: High-performance API framework
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **Python 3.10+**: Programming language

### Frontend

- **React 19.1.0**: UI library
- **React Router DOM 7.7.0**: Routing
- **Recharts 3.1.2**: Data visualization
- **Axios**: HTTP client for API requests

## Installation

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\Activate.ps1
# On Unix/MacOS:
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
python run.py
```

The backend server will start on http://localhost:8000 with API documentation available at http://localhost:8000/docs

### Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend development server will start on http://localhost:3000

## Usage Guide

1. **Home Page**: Navigate to the application home page
2. **Upload CSV**: Upload a CSV file for analysis
3. **Analysis**: View comprehensive analysis of the uploaded CSV
4. **Cleaning**: Navigate to the cleaning page to handle data issues:
   - View data quality visualization
   - See null data distribution by column
   - Review and apply type conversions
   - Clean the data
5. **View Removed Rows**: Analyze rows removed during cleaning

## API Endpoints

### CSV Analysis

- `POST /api/v1/csv/analyse-csv/`: CSV analysis with statistics and preview

### CSV Cleaning

- `POST /api/v1/csv/clean/`: Clean CSV data based on specified options
- `GET /api/v1/csv/removed-rows/`: View rows removed during cleaning
- `POST /api/v1/csv/convert-types/`: Convert column data types intelligently

## Data Visualization Components

The application includes several visualization components:

- **Data Quality Pie Chart**: Displays the proportion of valid vs. null data
- **Null Data Chart**: Shows null values distribution across columns
- **Type Conversion Chart**: Visualizes the results of type conversions

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Pandas](https://pandas.pydata.org/)
- [Recharts](https://recharts.org/)
