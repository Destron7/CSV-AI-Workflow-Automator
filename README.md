# CSV AI Workflow Automator

A full-stack AI-powered platform for CSV data analysis, cleaning, visualization, and conversational intelligence. Built with a **FastAPI** backend and **React** frontend, the application features two distinct AI pipelines — a **LangGraph Dashboard Pipeline** for automated dashboard generation and a **Dual-Agent CSV Chat Pipeline** for natural-language data exploration.

![CSV AI Workflow Automator](./frontend/public/logo192.png)

---

## Overview

Upload any CSV file and let AI do the heavy lifting. The application automatically detects data quality issues, cleans rows, converts types, generates interactive dashboards with charts and filters, and lets you chat with your data in natural language. Two dedicated AI pipelines power the intelligence layer:

1. **Dashboard Pipeline** — A LangGraph state-machine that parses CSVs, calls an LLM to design charts/filters, validates the output, computes aggregations, and assembles a full dashboard payload.
2. **CSV Chat Pipeline** — A dual-agent system where a Logic Agent (Qwen 2.5 Coder) executes pandas code and a Summary Agent (Llama 3.2) translates raw results into friendly Markdown.

---

## Features

- **CSV Analysis** — Data types, null counts, basic statistics, column profiles, and data preview
- **Data Cleaning** — Remove rows with nulls, remove duplicates, optional type conversion
- **Type Conversion** — Automatically convert string-like numbers to numeric columns
- **AI Dashboard Generation** — LLM-powered chart & filter recommendations, auto-aggregated data
- **Dashboard Chat (Q&A)** — Ask questions about your dashboard, create/remove charts via natural language
- **CSV Chat** — Dual-agent pipeline for open-ended data analysis with code execution
- **Causal Analysis** — Structure learning (PC algorithm) and causal effect estimation (DoWhy)
- **Time-Series Forecasting** — SARIMAX-based forecasting with confidence intervals
- **Interactive Filters** — Multiselect, slider, daterange, and toggle filters on dashboards
- **Visualizations** — Bar, line, pie, scatter, histogram, boxplot, heatmap, correlation matrix
- **Removed Rows Audit** — Inspect rows dropped during cleaning
- **Session Management** — Per-session state for both pipelines

---

## AI Pipeline Architecture

### Pipeline 1: Dashboard Pipeline (LangGraph)

A stateful, graph-based pipeline built with **LangGraph**. It uses an Ollama-hosted LLM to analyze CSV schemas and generate comprehensive dashboards, then supports ongoing Q&A, dynamic chart creation, and chart removal — all through the same graph.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH DASHBOARD PIPELINE                        │
│                                                                        │
│  ┌─────────────────────┐                                               │
│  │  Entry Point Router │ ─── payload exists? ─── YES ──┐               │
│  │ (route_from_orch.)  │                                │               │
│  └─────────┬───────────┘                                │               │
│            │ NO (first upload)                          │               │
│            ▼                                            │               │
│  ┌──────────────────┐                                   │               │
│  │    parse_csv      │  Read bytes → DataFrame          │               │
│  │                   │  Detect column types & stats     │               │
│  └────────┬─────────┘                                   │               │
│           ▼                                             │               │
│  ┌───────────────────────┐                              │               │
│  │ build_schema_summary  │  Compact JSON metadata       │               │
│  │                       │  + correlation hints         │               │
│  └────────┬──────────────┘                              │               │
│           ▼                                             │               │
│  ┌──────────────────┐                                   │               │
│  │  gemini_analyze   │  LLM call (schema-enforced)     │               │
│  │  (Ollama API)     │  → charts[], filters[], summary │               │
│  └────────┬─────────┘                                   │               │
│           ▼                                             │               │
│  ┌────────────────────────┐     ┌────────┐              │               │
│  │  validate_llm_output   │────▶│ retry  │──┐           │               │
│  │  (Pydantic parsing)    │fail │(max 2) │  │loop       │               │
│  └────────┬───────────────┘     └────────┘──┘           │               │
│           │ success                                     │               │
│           ▼                                             │               │
│  ┌──────────────────┐                                   │               │
│  │  infer_filters    │  Enrich filters with live        │               │
│  │                   │  values (options, min/max, etc.) │               │
│  └────────┬─────────┘                                   │               │
│           ▼                                             │               │
│  ┌────────────────────────┐                             │               │
│  │  compute_aggregations  │  Run pandas groupby/agg     │               │
│  │                        │  for each chart config      │               │
│  └────────┬───────────────┘                             │               │
│           ▼                                             │               │
│  ┌──────────────────────┐                               │               │
│  │  assemble_payload    │  Build final dashboard JSON   │               │
│  │                      │  (charts + filters + summary) │               │
│  └────────┬─────────────┘                               │               │
│           │                                             │               │
│           └─────────────────┬───────────────────────────┘               │
│                             ▼                                           │
│              ┌──────────────────────┐                                   │
│              │  check_chat_cache    │  Similarity-based cache check     │
│              └────────┬─────────────┘                                   │
│                       │ cache miss                                      │
│                       ▼                                                 │
│              ┌────────────────────────┐                                 │
│              │  detect_chart_intent   │  Regex + LLM fallback          │
│              │                        │  → CREATE / REMOVE / NONE      │
│              └────┬───────┬───────┬───┘                                │
│                   │       │       │                                     │
│           ┌───────┘       │       └────────┐                           │
│           ▼               ▼                ▼                           │
│  ┌─────────────────┐ ┌──────────┐ ┌────────────────────────┐          │
│  │ build_new_chart  │ │gemini_qa │ │remove_chart_from_payload│          │
│  │ (LLM → spec →   │ │(multi-   │ │(LLM identifies chart   │          │
│  │  aggregation)    │ │ turn Q&A)│ │ → removes from payload)│          │
│  └────────┬────────┘ └────┬─────┘ └────────────┬───────────┘          │
│           ▼               │                    │                       │
│  ┌──────────────────────┐ │                    │                       │
│  │append_chart_to_payload│ │                    │                       │
│  └──────────┬───────────┘ │                    │                       │
│             ▼             ▼                    ▼                       │
│           ┌──────────────────────────────────────┐                     │
│           │               END                    │                     │
│           └──────────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────┘
```

**Key Details:**
- **State**: `DashboardState` (TypedDict) — shared across all nodes, persisted per session
- **LLM Provider**: Ollama Cloud API (configurable via `OLLAMA_BASE_URL`)
- **Analyze Model**: `devstral-small-2:24b` — schema-enforced JSON output for chart/filter specs
- **QA Model**: `qwen3-next:80b` — multi-turn conversational Q&A with thinking enabled
- **Retry Logic**: Up to 2 retries on LLM output validation failure
- **Cache**: Sequence-matching similarity cache (threshold: 0.88) to avoid redundant LLM calls
- **Chart Generation**: Users can create new charts via natural language (regex + LLM intent detection)
- **Chart Removal**: Users can remove existing charts via natural language commands

---

### Pipeline 2: CSV Chat Pipeline (Dual-Agent)

A two-stage agent pipeline using **LangChain** for open-ended CSV data exploration. Each question flows through a Logic Agent that executes pandas code, then a Summary Agent that translates the raw output into human-friendly Markdown.

```
┌───────────────────────────────────────────────────────────────┐
│                  DUAL-AGENT CSV CHAT PIPELINE                  │
│                                                                │
│  ┌─────────────────┐                                           │
│  │   User Question  │                                          │
│  └────────┬────────┘                                           │
│           ▼                                                    │
│  ┌─────────────────────────────────────────┐                   │
│  │          STAGE 1: LOGIC AGENT           │                   │
│  │        (Qwen 2.5 Coder 7B)             │                   │
│  │                                         │                   │
│  │  • Zero-shot ReAct agent               │                   │
│  │  • Tool: python_repl_ast               │                   │
│  │  • Executes pandas code on DataFrame   │                   │
│  │  • Max 12 iterations, 120s timeout     │                   │
│  │  • Temperature: 0.0 (deterministic)    │                   │
│  │  • Output: raw stats, tables, numbers  │                   │
│  └────────┬────────────────────────────────┘                   │
│           │ raw technical output                               │
│           ▼                                                    │
│  ┌─────────────────────────────────────────┐                   │
│  │         STAGE 2: SUMMARY AGENT          │                   │
│  │           (Llama 3.2)                   │                   │
│  │                                         │                   │
│  │  • ChatPromptTemplate chain            │                   │
│  │  • Receives: question + raw result     │                   │
│  │  • Temperature: 0.3 (slightly creative)│                   │
│  │  • Output: friendly Markdown response  │                   │
│  │  • Fallback: returns raw output on fail│                   │
│  └────────┬────────────────────────────────┘                   │
│           │ friendly answer                                    │
│           ▼                                                    │
│  ┌─────────────────┐                                           │
│  │  User Response   │                                          │
│  └─────────────────┘                                           │
│                                                                │
│  Session Management:                                           │
│  • SessionManager → CSVChatbot instances keyed by UUID        │
│  • Each session holds its own DataFrame + agent instances     │
│  • LLMs served via local Ollama (localhost:11434)             │
└───────────────────────────────────────────────────────────────┘
```

**Key Details:**
- **Logic Model**: `qwen2.5-coder:7b` (local Ollama) — deterministic pandas code execution
- **Summary Model**: `llama3.2` (local Ollama) — natural language summarization
- **Framework**: LangChain `create_pandas_dataframe_agent` (zero-shot-react-description)
- **Code Execution**: `python_repl_ast` tool with dangerous code allowed for full DataFrame access
- **Error Handling**: Parsing error recovery, summarizer fallback to raw output
- **Session Isolation**: Each CSV upload creates an independent chatbot session

---

## Project Structure

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
│   ├── .env                          # Environment variables (local)
│   ├── .env.example                  # Environment template
│   ├── requirements.txt              # Python dependencies
│   └── run.py                        # Dev entry point
│
├── frontend/                         # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js                    # Root component with routes
│   │   ├── App.css                   # Global app styles
│   │   ├── index.js                  # React entry point
│   │   ├── index.css                 # Base styles
│   │   ├── components/
│   │   │   ├── charts/               # Recharts visualization components
│   │   │   │   ├── CorrelationMatrix.jsx
│   │   │   │   ├── DataQualityPieChart.jsx
│   │   │   │   ├── NullDataChart.jsx
│   │   │   │   ├── PieChart.jsx
│   │   │   │   └── TypeConversionChart.jsx
│   │   │   ├── dashboard/            # AI Dashboard components
│   │   │   │   ├── Dashboard.jsx     # Main dashboard layout
│   │   │   │   ├── ChartCard.jsx     # Individual chart renderer
│   │   │   │   ├── ChatPanel.jsx     # Dashboard chat sidebar
│   │   │   │   ├── FilterPanel.jsx   # Interactive filter controls
│   │   │   │   └── UploadZone.jsx    # CSV upload dropzone
│   │   │   ├── common/               # Shared components
│   │   │   │   └── Navbar.jsx
│   │   │   ├── layout/               # Layout components
│   │   │   │   └── Navbar.jsx
│   │   │   ├── ui/                   # Design system components
│   │   │   │   ├── GoToHomeButton.jsx
│   │   │   │   ├── bento-grid.jsx
│   │   │   │   ├── button.jsx
│   │   │   │   ├── csv-chatbot.jsx   # CSV Chat interface component
│   │   │   │   ├── glowing-card.jsx
│   │   │   │   ├── glowing-effect.jsx
│   │   │   │   ├── gooey-text-morphing.jsx
│   │   │   │   ├── navigation-menu.jsx
│   │   │   │   ├── particles.jsx
│   │   │   │   ├── popover.jsx
│   │   │   │   └── textarea.jsx
│   │   │   └── workflow/             # Causal/workflow components
│   │   │       ├── CausalConfig.jsx
│   │   │       └── FlowDAG.jsx
│   │   ├── hooks/                    # React custom hooks
│   │   │   ├── useCsvSelection.js
│   │   │   └── useDashboardSession.js
│   │   ├── pages/                    # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Chat.jsx              # CSV Chat page
│   │   │   ├── DashboardChat.jsx     # Dashboard Chat page
│   │   │   ├── CsvAnalysis.jsx
│   │   │   ├── CsvCleaning.jsx
│   │   │   ├── RemovedRowsView.jsx
│   │   │   └── NotFound404.jsx
│   │   ├── store/                    # Redux state management
│   │   │   ├── store.js
│   │   │   └── csvSlice.js
│   │   ├── utils/                    # Frontend utilities
│   │   │   ├── csvParser.js
│   │   │   ├── dashboardApi.js
│   │   │   └── sessionGuard.js
│   │   └── lib/
│   │       └── utils.js
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI/LLM**: LangGraph, LangChain, LangChain Experimental, Ollama (httpx)
- **Data**: Pandas, NumPy, Scikit-learn
- **Causal**: DoWhy, Causal-Learn (PC algorithm), NetworkX
- **Forecasting**: Statsmodels (SARIMAX)
- **Validation**: Pydantic v2

### Frontend
- **Framework**: React 19.1.0, React Router DOM 7.7.0
- **State**: Redux Toolkit, Redux Persist
- **Charts**: Recharts 3.7.0
- **UI**: TailwindCSS 3.4, Radix UI, Lucide Icons, Motion (Framer Motion)
- **HTTP**: Axios
- **Markdown**: React Markdown + remark-gfm

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) running locally (for CSV Chat pipeline)
- Ollama Cloud API key (for Dashboard pipeline, or configure local endpoint)

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

Create your `.env` file:

```bash
cp .env.example .env
```

**Environment Variables:**

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `https://ollama.com` | Ollama API base URL |
| `OLLAMA_API_KEY` | `""` | Ollama Cloud API key |
| `OLLAMA_ANALYZE_MODEL` | `devstral-small-2:24b` | Model for dashboard analysis |
| `OLLAMA_QA_MODEL` | `qwen3-next:80b` | Model for dashboard Q&A |
| `MAX_RETRY_COUNT` | `2` | LLM output validation retries |
| `CACHE_SIMILARITY_THRESHOLD` | `0.88` | Q&A cache similarity threshold |
| `SESSION_TTL_MINUTES` | `60` | Dashboard session TTL |
| `MAX_RAW_ROWS` | `500` | Max rows in dashboard payload |

Start backend (dev):

```bash
python run.py
```

API Docs: http://localhost:8000/docs

Start backend (production):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App: http://localhost:3000

### Ollama Setup (for CSV Chat)

The CSV Chat pipeline requires local Ollama with these models:

```bash
ollama pull qwen2.5-coder:7b
ollama pull llama3.2
```

Ensure Ollama is running on `http://localhost:11434`.

---

## Usage

1. **Upload a CSV** — Drag & drop or select a CSV file
2. **Analyze** — View schema, null counts, statistics, and data preview
3. **Clean** — Remove null rows, duplicates; optional type conversion
4. **Download** — Export the cleaned CSV
5. **AI Dashboard** — Upload a CSV to auto-generate an interactive dashboard with charts & filters
6. **Dashboard Chat** — Ask questions, create new charts, or remove existing ones via natural language
7. **CSV Chat** — Open-ended data exploration through the dual-agent pipeline
8. **Causal Analysis** — Discover causal relationships between variables
9. **Forecasting** — Generate time-series predictions with confidence intervals
10. **Removed Rows** — Audit rows dropped during cleaning

---

## API Endpoints (v1)

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root health check |
| `GET` | `/api/v1/health` | API health check |

### CSV Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/csv/analyse-csv/` | Analyze CSV schema & statistics |

### CSV Cleaning
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/csv/clean/remove-nulls/` | Clean CSV (nulls, duplicates, type conversion) |
| `POST` | `/api/v1/csv/clean/remove-nulls/download/` | Download cleaned CSV |
| `POST` | `/api/v1/csv/removed-rows/` | Get rows removed during cleaning |

### CSV Chat (Dual-Agent Pipeline)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat/upload` | Upload CSV → create chat session |
| `POST` | `/api/v1/chat/ask` | Ask question → dual-agent answer |
| `DELETE` | `/api/v1/chat/{session_id}` | Delete chat session |

### Dashboard Chat (LangGraph Pipeline)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/dashboard/dashboard-chat` | Upload CSV + question → dashboard + Q&A |
| `POST` | `/api/v1/dashboard/apply-filters` | Apply filters (no LLM, pure pandas) |

### Causal Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/csv/causal/analyze/` | Run causal analysis (requires clean data) |
| `POST` | `/api/v1/csv/causal/analyze-auto/` | Auto-clean + causal analysis |

### Forecasting
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/csv/forecast` | SARIMAX time-series forecast |

---

## Visualizations

- **Data Quality Pie** — Valid vs. invalid rows
- **Nulls per Column** — Bar chart of null counts
- **Type Conversion** — Success metrics by column
- **Correlation Matrix** — Numeric column correlations
- **Dashboard Charts** — Bar, line, pie, scatter, histogram, boxplot, heatmap (AI-generated)

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/xyz`
3. Commit: `git commit -m "feat: add xyz"`
4. Push: `git push origin feature/xyz`
5. Open a PR

---

## License

MIT

---

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [LangChain](https://python.langchain.com/)
- [Ollama](https://ollama.com/)
- [Pandas](https://pandas.pydata.org/)
- [Recharts](https://recharts.org/)
- [DoWhy](https://www.pywhy.org/dowhy/)
- [TailwindCSS](https://tailwindcss.com/)
