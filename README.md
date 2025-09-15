# CSV AI Workflow Automator

A full-stack solution for AI-powered CSV data analysis, cleaning, and workflow automation. The backend (FastAPI) handles CSV processing and analytics, while the frontend (React) delivers an intuitive UI for uploads, cleaning actions, and visualizations.

![CSV AI Workflow Automator](./frontend/public/logo192.png)

## Overview

This application streamlines CSV preparation by detecting data quality issues, cleaning rows (nulls and duplicates), converting types, and visualizing results. It also lets you inspect rows removed during cleaning.

## Features

- CSV Analysis: data types, null counts, basic stats, and preview
- Cleaning: remove rows with nulls, remove duplicate rows, optional type conversion
- Type Conversion: convert string-like numbers to numeric where possible
- Visualizations: data quality, nulls per column, type conversion success
- Removed Rows: dedicated view to inspect rows removed during cleaning

## Project Structure

```
CSV AI Workflow/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI app initialization
│   │   ├── config.py        # Settings
│   │   ├── api/
│   │   │   ├── api_v1.py    # API router aggregation
│   │   │   └── endpoints/
│   │   │       ├── csv_analysis.py
│   │   │       ├── csv_cleaning.py
│   │   │       └── health.py
│   │   ├── core/            # Processing utilities
│   │   │   ├── csv_processor.py
│   │   │   ├── data_cleaner.py
│   │   │   └── exceptions.py
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   ├── requirements.txt
│   └── run.py               # Dev entry point
├── frontend/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── charts/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Tech Stack

- Backend: FastAPI, Python 3.10+, Pandas, NumPy
- Frontend: React 19.1.0, React Router DOM 7.7.0, Recharts 3.1.2, Axios

## Setup

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
```

Optionally copy env file:

```bash
cp .env.example .env
```

Start backend (dev):

```bash
python run.py
```

Docs: http://localhost:8000/docs

Start backend (prod-style):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App (frontend): http://localhost:3000

## Usage

1. Upload a CSV file
2. Analyze to view schema, nulls, and preview
3. Clean to remove null and duplicate rows; optional type conversion
4. Download the cleaned CSV
5. View Removed Rows to audit what was dropped

## API Endpoints (v1)

- Health
  - GET `/` (root)
  - GET `/api/v1/health`
- CSV Analysis
  - POST `/api/v1/csv/analyse-csv/`
- CSV Cleaning
  - POST `/api/v1/csv/clean/remove-nulls/` (supports `remove_duplicates` flag)
  - POST `/api/v1/csv/clean/remove-nulls/download/` (download cleaned CSV)
  - POST `/api/v1/csv/removed-rows/` (returns removed rows dataset)

Notes:

- Cleaning response includes: original_rows, cleaned_rows, rows_removed, removal_percentage, null_rows_removed, duplicate_rows_removed, columns, cleaning_summary, type_conversions, and optional samples.

## Visualizations

- Data Quality Pie: valid vs. invalid rows
- Nulls per Column: bar chart
- Type Conversion: success metrics by column

## Contributing

- Fork repo
- Create feature branch: `git checkout -b feature/xyz`
- Commit: `git commit -m "feat: add xyz"`
- Push: `git push origin feature/xyz`
- Open PR

## License

MIT

## Acknowledgements

- FastAPI
- React
- Pandas
- Recharts
