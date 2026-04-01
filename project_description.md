# CSV AI Workflow Automator — Project Context

This document provides the full context of the "CSV AI Workflow Automator" project — its foundational goals, current state, the two AI pipelines powering it, and the features planned for future versions.

## 1. Project Goal

The **CSV AI Workflow Automator** is a full-stack, open-source web platform designed to automate data preparation, data cleaning, and advanced analytics tasks using AI. The core objective is to allow users (especially non-technical ones) to easily upload CSV data, configure data cleaning or analysis workflows through a simple no-code interface, and view the results in an intuitive dashboard.

The project aims to simplify workflows that involve:
- Data profiling and health checks.
- Automated data cleaning and formatting.
- AI-powered interactive dashboard generation.
- Natural-language data exploration through conversational AI.
- Advanced AI-driven analytics (causal inference, forecasting).

---

## 2. Present Status

The application has evolved from a CSV cleaning tool into a full AI-powered data analysis platform with two distinct AI pipelines, causal analysis, forecasting, and rich interactive visualizations.

### Tech Stack

**Frontend:**
- **Framework:** React 19.1.0 (with React Router DOM 7.7.0)
- **Styling:** TailwindCSS 3.4 (with `tailwindcss-animate`, `tailwind-merge`), Radix UI components
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`) + Redux Persist
- **Data Visualization:** Recharts 3.7.0
- **Animations:** Motion (Framer Motion)
- **Utilities:** Axios (API requests), PapaParse (client-side CSV parsing), uuid, React Markdown + remark-gfm
- **Icons:** Lucide React, Radix Icons

**Backend:**
- **Framework:** FastAPI (Python 3.10+) running on Uvicorn
- **AI / LLM Stack:** LangGraph (stateful pipeline), LangChain + LangChain Experimental (agent framework), Ollama (local & cloud LLM provider), httpx (Ollama API calls)
- **Data Processing & Analytics:** Pandas (>=2.0.0), NumPy (>=1.24.0)
- **Advanced ML / AI:** Scikit-learn (>=1.2.0), DoWhy (>=0.10.0 for Causal Inference), Causal-Learn (>=0.1.3.9), Statsmodels (>=0.14.0 for Forecasting)
- **Data Validation:** Pydantic v2
- **Visualization Support:** Matplotlib, Seaborn

### File Structure

```
CSV AI Workflow/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # FastAPI app initialization & CORS
│   │   ├── config.py                 # Settings (Ollama, agents, limits)
│   │   ├── api/
│   │   │   ├── api_v1.py             # API router aggregation
│   │   │   └── endpoints/
│   │   │       ├── health.py         # Health check endpoint
│   │   │       ├── csv_analysis.py   # CSV analysis (schema, stats, preview)
│   │   │       ├── csv_cleaning.py   # CSV cleaning (nulls, duplicates, types)
│   │   │       ├── chat.py           # CSV Chat (dual-agent pipeline)
│   │   │       ├── dashboard_chat.py # Dashboard Chat (LangGraph pipeline)
│   │   │       ├── causal.py         # Causal analysis (PC + DoWhy)
│   │   │       └── forecast.py       # Time-series forecasting (SARIMAX)
│   │   ├── core/                     # Processing engines
│   │   │   ├── agent_engine.py       # Dual-agent CSVChatbot + SessionManager
│   │   │   ├── csv_processor.py      # CSV parsing, cleaning, type conversion
│   │   │   ├── csv_processor_additions.py
│   │   │   ├── data_cleaner.py       # Data cleaning utilities
│   │   │   └── exceptions.py         # Custom exception classes
│   │   ├── graph/                    # LangGraph dashboard pipeline
│   │   │   ├── state.py              # DashboardState TypedDict
│   │   │   ├── nodes.py              # All pipeline nodes (parse, analyze, Q&A, chart ops)
│   │   │   ├── edges.py              # Conditional routing functions
│   │   │   └── builder.py            # StateGraph assembly & compilation
│   │   ├── models/                   # Pydantic models
│   │   │   ├── chat.py               # Chat request/response models
│   │   │   ├── dashboard.py          # LLMOutput schema (charts, filters, summary)
│   │   │   ├── requests.py           # Shared request models
│   │   │   └── responses.py          # Shared response models
│   │   ├── services/                 # Business logic layer
│   │   │   ├── analysis_service.py   # CSV analysis orchestration
│   │   │   ├── cleaning_service.py   # Cleaning orchestration
│   │   │   ├── causal_service.py     # PC algorithm + DoWhy estimation
│   │   │   ├── dashboard_session.py  # Dashboard session store
│   │   │   ├── forecast_service.py   # Forecasting service
│   │   │   ├── llm_service.py        # Ollama LLM factory (Qwen + Llama)
│   │   │   └── removed_rows_service.py
│   │   └── utils/                    # Helpers
│   │       ├── data_utils.py         # Data transformation utilities
│   │       ├── file_utils.py         # File I/O helpers
│   │       ├── logger.py             # Logging configuration
│   │       └── ollama_check.py       # Ollama connectivity checker
│   ├── tests/                        # Backend test suite
│   ├── .env / .env.example           # Environment variables
│   ├── requirements.txt              # Python dependencies
│   └── run.py                        # Dev entry point
│
├── frontend/                         # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js                    # Root component with routes
│   │   ├── components/
│   │   │   ├── charts/               # Recharts visualizations (Pie, Null, Correlation, etc.)
│   │   │   ├── dashboard/            # AI Dashboard (Dashboard, ChartCard, ChatPanel, FilterPanel, UploadZone)
│   │   │   ├── common/               # Shared components (Navbar)
│   │   │   ├── layout/               # Layout components (Navbar)
│   │   │   ├── ui/                   # Design system (buttons, csv-chatbot, particles, glowing effects, etc.)
│   │   │   └── workflow/             # Causal workflow (CausalConfig, FlowDAG)
│   │   ├── hooks/                    # Custom hooks (useCsvSelection, useDashboardSession)
│   │   ├── pages/                    # Pages (Home, Chat, DashboardChat, CsvAnalysis, CsvCleaning, etc.)
│   │   ├── store/                    # Redux state (store, csvSlice)
│   │   ├── utils/                    # Utilities (csvParser, dashboardApi, sessionGuard)
│   │   └── lib/                      # Shared JS utilities
│   ├── package.json
│   └── tailwind.config.js
│
├── learning/                         # Jupyter Notebooks for research & testing
├── Cleaned Files/                    # Output directory for cleaned CSVs
├── ideas.txt                         # Deferred feature ideas & brainstorming
├── project_description.md            # This file — full project context & roadmap
└── README.md                         # Project documentation & setup guide
```

### Currently Implemented Features

#### Core Data Processing
- **CSV Analysis:** Automatically analyzes uploaded CSVs to provide schema details, data types, null counts, basic statistics, and a data preview.
- **Automated Cleaning:** Remove rows with null values, drop duplicates, and perform intelligent type conversions (e.g., string-like numbers → actual numerics).
- **Data Visualizations:** Interactive charts (Recharts) showing Data Quality (valid vs. invalid rows), Nulls per Column, Type Conversion success, and Correlation Matrices.
- **Removed Rows Audit:** Dedicated view to inspect exactly which rows were dropped during cleaning.
- **Download:** Export the fully cleaned CSV file.

#### AI Pipeline 1: Dashboard Pipeline (LangGraph) ✅
A stateful, graph-based pipeline built with **LangGraph** that uses Ollama-hosted LLMs to:
- **Parse CSV** → Read bytes into a DataFrame, detect column types (numeric, datetime, categorical, text), compute stats (nulls, unique, min/max/mean, sample values).
- **Build Schema Summary** → Compact JSON metadata including notable correlations for scatter plot guidance.
- **LLM Analysis** → Call Ollama with schema-enforced JSON output (Pydantic `LLMOutput` schema) to generate chart specs, filter specs, and dataset summary. Models used: `devstral-small-2:24b` for analysis, `qwen3-next:80b` for Q&A.
- **Validation & Retry** → Pydantic parsing with up to 2 automatic retries on failure.
- **Filter Enrichment** → Populate filter options, slider ranges, and date bounds from live DataFrame data.
- **Aggregation** → Run pandas groupby/agg for each chart (sum, mean, median, count, none).
- **Payload Assembly** → Build final JSON payload (charts + data, filters, summary, rawData, meta). NaN/Infinity values cleaned recursively.
- **Multi-Turn Q&A** → Full conversation history, lightweight dashboard context, thinking-enabled responses.
- **Dynamic Chart Creation** → Users create new charts via natural language ("plot a bar chart of sales by region"). Intent detection via regex + LLM fallback.
- **Dynamic Chart Removal** → Users remove charts via natural language ("remove the pie chart"). LLM identifies the target chart by matching against available chart metadata.
- **Cache System** → Sequence-matching similarity cache (threshold: 0.88) to skip redundant LLM calls.
- **Filter Application** → Lightning-fast endpoint (`/apply-filters`) that re-runs aggregations on filtered DataFrames without invoking the LLM.

#### AI Pipeline 2: CSV Chat Pipeline (Dual-Agent) ✅
A two-stage agent pipeline using **LangChain** for open-ended CSV data exploration:
- **Stage 1 — Logic Agent (Qwen 2.5 Coder 7B):** Zero-shot ReAct agent that executes pandas code against the DataFrame using `python_repl_ast`. Temperature 0.0, max 12 iterations, 120s timeout. Returns raw stats, tables, numbers.
- **Stage 2 — Summary Agent (Llama 3.2):** ChatPromptTemplate chain that takes the user question + raw result and produces a friendly Markdown response. Temperature 0.3 with fallback to raw output on failure.
- **Session Management:** `SessionManager` manages multiple `CSVChatbot` instances keyed by UUID, each holding its own DataFrame and agent instances.
- **LLM Provider:** Local Ollama (`localhost:11434`) via `langchain-ollama`.

#### Advanced Analytics ✅
- **Causal Analysis:** PC algorithm (causal-learn) for structure learning + DoWhy for causal effect estimation. Two endpoints: manual (requires pre-cleaned data) and auto (cleans + analyzes in one call).
- **Time-Series Forecasting:** SARIMAX model (statsmodels) with configurable steps, exogenous variables, and confidence intervals.

---

## 3. What to Implement Ahead (Future Roadmap)

The foundation is solid. The next phase focuses on deepening AI capabilities, improving UX, and adding enterprise-grade features.

### High Priority

1. **Multi-File & Relational Data Support:**
   - Allow uploading multiple CSVs and defining relationships (joins, foreign keys).
   - Enable cross-dataset queries in both Chat and Dashboard pipelines.
   - Auto-detect potential join keys between datasets.

2. **Agentic Workflow Builder (No-Code):**
   - Drag-and-drop visual workflow builder where users chain together: Upload → Clean → Analyze → Dashboard → Export.
   - Each node in the workflow corresponds to an API call; the LLM helps configure parameters.
   - Save, share, and re-run workflows on new data.

3. **Richer Dashboard Interactivity:**
   - Chart drill-down — click a bar segment to filter other charts.
   - Cross-filtering between charts (linked brushing).
   - Dashboard layout customization (drag-and-resize chart cards).
   - Export dashboard as PDF/PNG report.

4. **Streaming LLM Responses:**
   - Stream Q&A answers token-by-token using SSE (Server-Sent Events) instead of waiting for full completion.
   - Show thinking traces in the UI for transparency.

### Medium Priority

5. **Data Transformation Pipeline:**
   - Column renaming, reordering, and formula-based derived columns.
   - Pivot tables, melt/unpivot, and aggregation transformations.
   - LLM-suggested transformations based on schema analysis.

6. **Simulation & "What-If" Scenarios:**
   - Allow users to modify baseline data (e.g., "increase advertising budget by 10%") and re-run causal effect estimations to simulate business outcomes.
   - Integrate with the Dashboard pipeline to visualize scenario comparisons.

7. **Enhanced Causal & Forecasting UX:**
   - LLM-guided co-pilot for configuring causal analysis (treatment/outcome selection, estimator choice).
   - Forecast comparison — run multiple models (ARIMA, Prophet, SARIMAX) and compare results side-by-side.
   - Automatic anomaly detection on time-series data.

8. **User Authentication & Multi-Tenancy:**
   - User accounts with JWT authentication.
   - Persistent session storage (Redis or PostgreSQL) instead of in-memory dicts.
   - Dataset history and versioning per user.

### Lower Priority / Exploratory

9. **Plugin System for Custom Analyses:**
   - Allow users to write custom Python analysis scripts that plug into the pipeline.
   - Marketplace for community-contributed analysis templates.

10. **Excel & Google Sheets Support:**
    - Extend file upload to support `.xlsx`, `.xls`, and direct Google Sheets URL import.
    - Read from multiple sheets within a workbook.

11. **Automated Report Generation:**
    - LLM-written executive summary of the entire analysis.
    - Auto-generated PDF/HTML reports with charts, insights, and recommendations.

12. **Real-Time Data Connectors:**
    - Connect to databases (PostgreSQL, MySQL, SQLite) and APIs.
    - Scheduled re-analysis on updated data sources.

13. **Advanced Visualization Types:**
    - Sankey diagrams, treemaps, geographic maps, radar charts.
    - Network/graph visualizations for causal DAGs.
    - 3D scatter plots for high-dimensional exploration.

14. **Model Fine-Tuning & RAG:**
    - Fine-tune local models on domain-specific CSV datasets for better analysis accuracy.
    - RAG (Retrieval-Augmented Generation) over uploaded data dictionaries and documentation.

---

## 4. Design Philosophy

- **AI-First:** Every feature should be enhanced by AI — not just bolted on. The LLM is a first-class citizen in the architecture.
- **Open-Source & Local:** Prefer open-source models and local inference. No data leaves the user's machine unless they explicitly opt for cloud models.
- **Progressive Complexity:** Simple tasks (upload, clean, preview) require zero configuration. Advanced tasks (causal analysis, forecasting) are guided by AI co-pilots.
- **Pipeline Architecture:** Both AI pipelines are designed as composable, testable graphs/chains — not monolithic functions. New capabilities are added as new nodes/agents.
