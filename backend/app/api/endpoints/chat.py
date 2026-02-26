from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import logging

from app.models.chat import ChatResponse
from app.core.exceptions import ChatError, CSVProcessingError
from app.core.agent_engine import interrogator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ChatResponse)
async def chat_with_csv(
    message: str = Form(..., description="The natural language question to ask the CSV"),
    model_name: str = Form("llama3", description="The local LLM to use"),
    file: UploadFile = File(..., description="The CSV file payload")
):
    """
    Endpoint for querying a CSV file using a local LLM via LangChain.
    """
    try:
        # Execute the zero-shot query through the Interrogator agent
        result = interrogator.execute_query(
            file=file,
            query=message,
            model_name=model_name
        )

        return ChatResponse(
            answer=result["answer"],
            executed_code=result["executed_code"],
            model_used=result["model_used"]
        )

    except ChatError as e:
        logger.error(f"Chat execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except CSVProcessingError as e:
        logger.error(f"CSV payload issue for chat: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while processing the chat.")
