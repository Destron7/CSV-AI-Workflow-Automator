from pydantic import BaseModel, Field

class ChatResponse(BaseModel):
    """Response model for the CSV chatbot"""

    answer: str = Field(..., description="The AI's natural language answer")
    executed_code: str = Field(
        ..., description="The Python code the AI executed to find the answer"
    )
    model_used: str = Field(..., description="The name of the model that was used")
