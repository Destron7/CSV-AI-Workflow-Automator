"""
Dual-Agent CSV Analysis Pipeline

Architecture:
  Stage 1 — Logic Agent (Qwen 2.5 Coder):
      Executes pandas code against the DataFrame and returns raw stats/numbers.
  Stage 2 — Summary Agent (Llama 3.2):
      Translates the raw technical output into friendly, non-technical Markdown.

  CSVChatbot  — wraps both stages for a single CSV session
  SessionManager — manages multiple chatbot sessions keyed by UUID
"""

import re
import uuid
import pandas as pd
import logging
from typing import Dict

from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.core.exceptions import ChatError
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


# ── Prompt constants ────────────────────────────────────────────────

LOGIC_PREFIX = (
    "You are a strict data-analysis engine. You have access to a pandas DataFrame called `df`. "
    "Answer the user's question by writing and executing Python code.\n\n"
    "CRITICAL — TOOL USAGE FORMAT:\n"
    "You have exactly ONE tool: `python_repl_ast`.\n"
    "You MUST use this EXACT format — no other format is accepted:\n\n"
    "Action: python_repl_ast\n"
    "Action Input: <your python code here>\n\n"
    "Example:\n"
    "Action: python_repl_ast\n"
    "Action Input: print(df.describe())\n\n"
    "⚠️ The Action MUST be literally `python_repl_ast` — never write a description there.\n"
    "⚠️ Always use `print()` to display results so they appear in the output.\n\n"
    "DATA ACCESS RULES:\n"
    "- The preview below shows only a FEW rows. The FULL dataset is loaded in `df`.\n"
    "- First N rows: `print(df.head(N))`\n"
    "- Last N rows: `print(df.tail(N))` — do NOT just repeat df.head()!\n"
    "- Total rows: `print(len(df))`\n"
    "- Specific range: `print(df.iloc[start:end])`\n"
    "- ALWAYS execute the code and return the ACTUAL output from the DataFrame.\n\n"
    "OUTPUT RULES:\n"
    "1. Return ONLY raw data, numbers, statistics, column names, or DataFrame output.\n"
    "2. DO NOT add any explanations, opinions, or human-friendly phrasing.\n"
    "3. DO NOT include any JSON, tool calls, or function calls in your final answer.\n"
    "4. If the result is a table, output it as a plain Markdown table.\n"
    "5. If the result is a single number, just output the number.\n"
    "6. NEVER say 'as shown above' — the user can ONLY see your final answer.\n"
    "7. Always preserve full numerical precision — never round unless asked.\n\n"
)

SUMMARY_TEMPLATE = """\
You are a friendly data analyst who explains things in plain English.
You will receive two pieces of information:
1. The user's original question about their CSV data.
2. A raw technical analysis result produced by a code-execution engine.

Your job is to translate the raw result into a **clear, non-technical Markdown response**.

RULES:
- Preserve 100% of the numerical accuracy — never round or approximate numbers.
- Use bullet points, bold text, and Markdown tables where they improve readability.
- Do NOT mention code, pandas, DataFrames, Python, or any technical process.
- Write as if you are directly answering the user's question in a conversation.
- Keep your answer concise and well-structured.
- If the raw result contains a table, reproduce it as a clean Markdown table.

---

**User's question:** {question}

**Raw analysis result:**
{raw_result}

---

Your friendly answer:"""


class CSVChatbot:
    """
    Dual-agent chatbot for a single CSV dataset.

    Stage 1: Logic Agent (Qwen) — runs pandas code, produces raw output.
    Stage 2: Summarizer (Llama) — converts raw output to friendly Markdown.
    """

    def __init__(self, df: pd.DataFrame):
        self.df = df

        # ── Stage 1: Logic LLM (Qwen 2.5 Coder) ──
        self.logic_llm = llm_service.get_logic_llm()
        self.logic_agent = create_pandas_dataframe_agent(
            self.logic_llm,
            self.df,
            verbose=True,
            agent_type="zero-shot-react-description",
            allow_dangerous_code=True,
            prefix=LOGIC_PREFIX,
            number_of_head_rows=20,
            max_iterations=settings.AGENT_MAX_ITERATIONS,
            max_execution_time=settings.AGENT_MAX_EXECUTION_TIME,
            agent_executor_kwargs={
                "handle_parsing_errors": (
                    "Wrong format! You must use EXACTLY:\n"
                    "Action: python_repl_ast\n"
                    "Action Input: <your python code>\n\n"
                    "Try again with the correct format."
                ),
            },
        )

        # ── Stage 2: Summary LLM (Llama 3.2) ──
        self.summary_llm = llm_service.get_summary_llm()
        self.summary_prompt = ChatPromptTemplate.from_template(SUMMARY_TEMPLATE)
        self.summary_chain = self.summary_prompt | self.summary_llm

    # ── Public API ──────────────────────────────────────────────────

    def ask(self, question: str) -> str:
        """Ask a question — runs through both pipeline stages."""
        try:
            # Stage 1: Technical analysis
            raw_result = self._run_logic_agent(question)
            logger.info(f"[Stage 1] Raw result ({len(raw_result)} chars): {raw_result[:200]}...")

            # Stage 2: Friendly summarization
            friendly_answer = self._run_summarizer(question, raw_result)
            logger.info(f"[Stage 2] Friendly answer ({len(friendly_answer)} chars)")

            if not friendly_answer or friendly_answer.strip() == "":
                friendly_answer = (
                    "I wasn't able to determine the answer within the allowed steps. "
                    "Please try rephrasing your question."
                )

            return friendly_answer

        except ChatError:
            raise
        except Exception as e:
            logger.error(f"Pipeline error during ask(): {e}")
            raise ChatError(f"The analysis pipeline encountered an error: {str(e)}")

    # ── Private stages ──────────────────────────────────────────────

    def _run_logic_agent(self, question: str) -> str:
        """Stage 1: Run the pandas agent and return raw technical output."""
        try:
            response = self.logic_agent.invoke({"input": question})
            raw = response.get("output", "No output produced.")
            return self._clean_response(raw)
        except Exception as e:
            logger.error(f"Logic agent error: {e}")
            raise ChatError(f"The logic agent failed: {str(e)}")

    def _run_summarizer(self, question: str, raw_result: str) -> str:
        """Stage 2: Translate raw analysis into friendly Markdown."""
        try:
            response = self.summary_chain.invoke({
                "question": question,
                "raw_result": raw_result,
            })
            return response.content.strip()
        except Exception as e:
            logger.error(f"Summary agent error: {e}")
            # Fallback: return the raw result if summarizer fails
            logger.warning("Falling back to raw logic output.")
            return raw_result

    def _clean_response(self, text: str) -> str:
        """Strip leaked tool-call JSON and intermediate output markers."""
        if not text:
            return text
        # Remove JSON tool-call blocks
        text = re.sub(
            r'\{\s*"name"\s*:\s*"[^"]*"\s*,\s*"parameters"\s*:\s*\{[^}]*\}\s*\}',
            '', text
        )
        # Remove "Output:" labels
        text = re.sub(r'(?m)^Output:\s*$', '', text)
        # Collapse multiple blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @property
    def pipeline_label(self) -> str:
        """Human-readable pipeline description."""
        return f"{llm_service.LOGIC_MODEL} → {llm_service.SUMMARY_MODEL}"


class SessionManager:
    """Manages multiple CSVChatbot sessions in memory."""

    def __init__(self):
        self._sessions: Dict[str, CSVChatbot] = {}

    def create_session(self, df: pd.DataFrame) -> str:
        """Create a new dual-agent chatbot session. Returns the session_id."""
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = CSVChatbot(df=df)
        logger.info(
            f"Session created: {session_id} "
            f"(pipeline={llm_service.LOGIC_MODEL}→{llm_service.SUMMARY_MODEL}, "
            f"rows={len(df)}, cols={len(df.columns)})"
        )
        return session_id

    def get_session(self, session_id: str) -> CSVChatbot:
        """Retrieve an existing session. Raises ChatError if not found."""
        chatbot = self._sessions.get(session_id)
        if chatbot is None:
            raise ChatError(
                f"Session '{session_id}' not found. "
                "Please upload a CSV file first to start a new session."
            )
        return chatbot

    def delete_session(self, session_id: str) -> bool:
        """Delete a session. Returns True if it existed."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"Session deleted: {session_id}")
            return True
        return False

    @property
    def active_count(self) -> int:
        return len(self._sessions)


# Singleton session manager
session_manager = SessionManager()
