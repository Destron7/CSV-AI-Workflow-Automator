# CSV AI Workflow Automator - Project Context

This document provides the full context of the "CSV AI Workflow Automator" project. Please use this information to understand the project's foundational goals, its current state, and the upcoming features we are planning to build.

## 1. Project Goal
The **CSV AI Workflow Automator** is a full-stack, open-source web platform designed to automate data preparation, data cleaning, and advanced analytics tasks using AI. The core objective is to allow users (especially non-technical ones) to easily upload CSV data, configure data cleaning or analysis workflows through a simple no-code interface, and view the results in an intuitive dashboard. 

The project aims to simplify workflows that involve:
- Data profiling and health checks.
- Automated data cleaning and formatting.
- Advanced AI-driven analytics (e.g., causal inference, forecasting).

## 2. Present Status
The current application provides a robust and fast foundation for CSV processing, built with a modern tech stack.

### Tech Stack
**Frontend:**
- **Framework:** React 19.1.0 (with React Router DOM 7.7.0)
- **Styling:** Tailwind CSS (with `tailwindcss-animate` and `tailwind-merge`), and Radix UI components
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`)
- **Data Visualization:** Recharts 3.1.2
- **Animations:** Framer Motion (`motion`)
- **Utilities:** Axios (for API requests), PapaParse (for client-side CSV parsing)

**Backend:**
- **Framework:** FastAPI (Python 3.10+) running on Uvicorn
- **Data Processing & Analytics:** Pandas (>=2.0.0), NumPy (>=1.24.0)
- **Advanced Machine Learning / AI:** Scikit-learn (>=1.2.0), DoWhy (>=0.10.0 for Causal Inference), Causal-Learn (>=0.1.3.9), Statsmodels (>=0.14.0 for Forecasting)
- **Data Validation:** Pydantic (>=2.0.0)
- **Visualization Support:** Matplotlib, Seaborn

### File Structure
```
CSV AI Workflow/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── main.py          # FastAPI app initialization and CORS setup
│   │   ├── config.py        # Environment variables and settings
│   │   ├── api/             # API routing configurations
│   │   │   ├── api_v1.py    # API router aggregation 
│   │   │   └── endpoints/   # Distinct API endpoints (e.g., csv_analysis, csv_cleaning)
│   │   ├── core/            # Core processing logic
│   │   │   ├── csv_processor.py # Utilities to handle CSV files via Pandas
│   │   │   ├── data_cleaner.py  # Data cleaning logic (nulls, duplicates, typing)
│   │   │   └── exceptions.py    # Custom error handling
│   │   ├── models/          # Pydantic models for validation and responses
│   │   ├── services/        # Business logic for decoupled services (e.g., analysis_service)
│   │   └── utils/           # Shared helper functions
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Development server entry point
│
├── frontend/                # React frontend application
│   ├── public/              # Static assets (favicon, index.html)
│   ├── src/                 # Application source code
│   │   ├── components/      # React functional components
│   │   │   ├── charts/      # Recharts wrapper components
│   │   │   ├── layout/      # Structuring elements (e.g., Navbar)
│   │   │   ├── ui/          # Reusable UI building blocks (Buttons, Popovers, etc.)
│   │   │   └── workflow/    # Specific feature components (e.g., CausalConfig)
│   │   ├── lib/             # Utility JS files
│   │   ├── pages/           # High-level page components (e.g., Home)
│   │   ├── store/           # Redux state configurations
│   │   ├── App.js           # Main React component establishing Routes
│   │   ├── index.js         # Frontend initialization point
│   │   └── index.css        # Global CSS / Tailwind directives
│   └── package.json         # Node.js dependencies and scripts
│
├── learning/                # Jupyter Notebooks for testing logic (e.g., ydata_profiling, DoWhy)
├── Cleaned Files/           # Output directory for data cleaned by the backend
├── ideas.txt                # Documentation tracking deferred features (Causal Analysis, SARIMAX)
└── README.md                # General project documentation
```

### Currently Implemented Features:
- **CSV Analysis:** Automatically analyzes uploaded CSVs to provide schema details, data types, null counts, basic statistics, and a data preview.
- **Automated Cleaning:** Users can clean data by removing rows with null values, dropping duplicates, and performing intelligent type conversions (e.g., converting string-like numbers to actual numerics).
- **Data Visualizations:** Interactive charts (built with `recharts`) showing Data Quality (valid vs. invalid rows), Nulls per Column, and Type Conversion success metrics.
- **Removed Rows Audit:** A dedicated view allowing users to inspect exactly which rows were dropped during the cleaning process, ensuring maximum transparency.
- **Download:** Users can download the fully cleaned CSV file.

### Paused / Removed Features (Documented in `ideas.txt`):
To streamline the core user experience, the following advanced analytics features were temporarily removed. However, the backend logic and research (e.g., Jupyter notebooks in the `/learning` directory) still exist and are planned for re-integration:
- **Causal Analysis:** Using the `dowhy` and `causal-learn` libraries to identify cause-and-effect relationships (e.g., "does advertising cause higher sales?") using PC algorithms and various estimators.
- **SARIMAX Forecasting:** Time-series forecasting using `statsmodels` to predict future target values based on historical data.

## 3. What to Implement Ahead (Future Roadmap)
Moving forward, we want to level up the application by re-introducing advanced analytics, building a dynamic visualization pipeline, and deeply integrating fully open-source LLM capabilities.

### Upcoming Core Features:
1. **Dynamic AI-Driven Dashboard Pipeline (Top Priority):**
   - Implement a high-level AI/ML pipeline that programmatically understands the structure, semantics, and relationships within the uploaded CSV data.
   - Based on this understanding, the AI will autonomously suggest and plot the most relevant, highly interactive graphs (e.g., scatter plots for correlations, time-series for temporal data, heatmaps for distributions).
   - The result is a fully customized, interactive dashboard returned to the user instantly—turning raw data into a visual story without user configuration.
2. **Open-Source Local LLM Integration:** 
   - Integrate an open-source, local language model (using frameworks like Ollama, vLLM, or huggingface `transformers`) directly into the app so users can interact with their CSV data via natural language.
   - **Role of the LLM:** Act as an intelligent data assistant that runs completely free of cost and privately. It will be responsible for explaining data summaries, powering the dynamic dashboard suggestions, and interpreting complex analytics results.
   - Example Models: Llama 3 (Meta), Mistral, or Qwen.
3. **Re-integrating Causal Analysis & Forecasting:**
   - Bring back the DoWhy causal analysis and SARIMAX forecasting modules. The local open-source LLM will help guide the user through configuring these complex tasks, serving as a co-pilot.
4. **Simulation & "What-If" Scenarios:** 
   - Allow users to modify baseline data (e.g., "increase advertising budget by 10%") and re-run causal effect estimations to simulate business outcomes.
5. **Enhanced Visualizations:** 
   - Add advanced visualizations for structural causal graphs (DAGs) and forecast trend lines back into the frontend dashboard alongside the dynamic generation pipeline.
