from langchain_ollama import ChatOllama
from app.core.exceptions import ChatError


class LLMService:
    """Service to interact with local LLMs via Ollama.

    Provides two purpose-specific models:
      - logic_llm:   Qwen 2.5 Coder 7B  → deterministic pandas code execution
      - summary_llm: Llama 3.2          → friendly natural-language summarization
    """

    LOGIC_MODEL = "qwen2.5-coder:7b"
    SUMMARY_MODEL = "llama3.2"

    def _create_llm(self, model: str, temperature: float) -> ChatOllama:
        """Internal factory for ChatOllama instances."""
        try:
            return ChatOllama(
                model=model,
                temperature=temperature,
                base_url="http://localhost:11434",
                num_gpu=-1,  # offload all layers to GPU (CUDA)
            )
        except Exception as e:
            raise ChatError(
                f"Failed to initialize ChatOllama with model '{model}'. "
                f"Ensure Ollama is running locally and the model is pulled. Error: {str(e)}"
            )

    def get_logic_llm(self) -> ChatOllama:
        """Qwen 2.5 Coder — deterministic code generation for pandas analysis."""
        return self._create_llm(self.LOGIC_MODEL, temperature=0.0)

    def get_summary_llm(self) -> ChatOllama:
        """Llama 3.2 — slightly creative for human-friendly summarization."""
        return self._create_llm(self.SUMMARY_MODEL, temperature=0.3)

    # Keep backward-compat for any other callers
    def get_llm(self, model_name: str = None) -> ChatOllama:
        """Generic factory (defaults to logic model)."""
        return self._create_llm(model_name or self.LOGIC_MODEL, temperature=0.0)


# Singleton
llm_service = LLMService()
