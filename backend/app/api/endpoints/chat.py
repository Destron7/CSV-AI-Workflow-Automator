"""
Chat API endpoints — dual-agent pipeline architecture.

Flow:
  1. POST /chat/upload  → upload CSV → get session_id (models are fixed server-side)
  2. POST /chat/ask     → send question + session_id → get friendly answer
  3. DELETE /chat/{id}  → end session (optional cleanup)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
import pandas as pd
import logging

from app.models.chat import UploadResponse, AskRequest, AskResponse
from app.core.exceptions import ChatError, CSVProcessingError
from app.core.agent_engine import session_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(..., description="The CSV file to analyze"),
):
    """
    Upload a CSV file to start a new dual-agent chat session.
    Models are fixed: Qwen 2.5 Coder (logic) → Llama 3.2 (summarizer).
    Returns a session_id to use for subsequent questions.
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    # Load the CSV into a DataFrame
    try:
        df = pd.read_csv(file.file)
        if df.empty:
            raise CSVProcessingError("The uploaded CSV file is empty.")
    except CSVProcessingError:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

    # Create a dual-agent chatbot session
    try:
        session_id = session_manager.create_session(df=df)
        chatbot = session_manager.get_session(session_id)
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize chatbot: {str(e)}")

    return UploadResponse(
        session_id=session_id,
        columns=df.columns.tolist(),
        row_count=len(df),
        models_used=chatbot.pipeline_label,
    )


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Ask a question about the CSV in an existing session.
    The question flows through the dual-agent pipeline:
      Stage 1 (Qwen) → raw analysis → Stage 2 (Llama) → friendly answer.
    """
    try:
        chatbot = session_manager.get_session(request.session_id)
        answer = chatbot.ask(request.question)

        return AskResponse(
            answer=answer,
            models_used=chatbot.pipeline_label,
        )

    except ChatError as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in ask: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while processing the question.")


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """End a chat session and free resources."""
    deleted = session_manager.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"detail": "Session deleted."}
