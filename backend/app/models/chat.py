from pydantic import BaseModel, Field
from typing import List, Literal


class ChatMessage(BaseModel):
    """A single message in the conversation history"""
    role: Literal["user", "assistant"] = Field(..., description="Who sent the message")
    content: str = Field(..., description="The message content")


class UploadResponse(BaseModel):
    """Response after uploading a CSV to start a session"""
    session_id: str = Field(..., description="Unique session identifier")
    columns: List[str] = Field(..., description="Column names in the CSV")
    row_count: int = Field(..., description="Number of rows in the CSV")
    models_used: str = Field(..., description="Pipeline models (e.g. 'qwen2.5-coder:7b → llama3.2')")


class AskRequest(BaseModel):
    """Request body for asking a question"""
    session_id: str = Field(..., description="The session ID from upload")
    question: str = Field(..., description="The natural language question")


class AskResponse(BaseModel):
    """Response from asking a question"""
    answer: str = Field(..., description="The AI's natural language answer")
    models_used: str = Field(..., description="Pipeline models used for this answer")
