from langchain_community.chat_models import ChatOllama
from app.core.exceptions import ChatError


class LLMService:
    """Service to interact with the local LLM safely"""

    def __init__(self):
        # Only model currently available: llama3.1:8b
        self.default_model = "llama3.1:8b"

    def get_llm(self, model_name: str = None) -> ChatOllama:
        """
        Get an instance of ChatOllama.

        Args:
            model_name (str): The exact Ollama model tag (e.g., 'llama3.1:8b').
                              Defaults to llama3.1:8b.

        Returns:
            ChatOllama: An initialized chat model.
        """
        target_model = model_name if model_name else self.default_model

        try:
            # We configure ChatOllama to use the local Ollama instance (typically running on localhost:11434)
            # num_gpu=-1 tells Ollama to offload ALL model layers to GPU (CUDA)
            llm = ChatOllama(
                model=target_model,
                temperature=0.0,
                num_gpu=-1,      # use all available GPU layers (CUDA)
            )
            return llm
        except Exception as e:
            raise ChatError(
                f"Failed to initialize ChatOllama with model '{target_model}'. "
                f"Ensure Ollama is running locally and the model is pulled. Error: {str(e)}"
            )

# Create a singleton instance to be used across the application
llm_service = LLMService()
