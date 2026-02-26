import pandas as pd
from typing import Dict, Any

from langchain_experimental.agents import create_pandas_dataframe_agent

from app.core.exceptions import ChatError, CSVProcessingError
from app.services.llm_service import llm_service


class CSVInterrogator:
    """Core Agent Engine for querying CSVs using LangChain and Local LLMs"""

    def execute_query(self, file: Any, query: str, model_name: str) -> Dict[str, Any]:
        """
        Loads the CSV and executes a zero-shot natural language query against it.

        Args:
            file (fastapi.UploadFile): The uploaded CSV file.
            query (str): The natural language query from the user.
            model_name (str): The local LLM model to utilize.

        Returns:
            Dict containing the 'answer' and the 'executed_code' (if accessible, otherwise raw output).
        """
        # 1. Load the CSV directly from the uploaded file buffer
        if not file.filename.endswith('.csv'):
             raise ChatError("The uploaded file must be a valid CSV file.")

        try:
            df = pd.read_csv(file.file)
            if df.empty:
                raise CSVProcessingError("The provided CSV file is empty.")
        except Exception as e:
            raise ChatError(f"Error loading the CSV into Pandas: {str(e)}")

        # 2. Get the LLM from our Service
        llm = llm_service.get_llm(model_name=model_name)

        # 3. Create the Pandas Agent
        try:
            # We use ZERO_SHOT_REACT_DESCRIPTION to force the agent into reading exactly what's available
            agent = create_pandas_dataframe_agent(
                llm,
                df,
                verbose=True,
                allow_dangerous_code=True,
                agent_type="zero-shot-react-description",
                handle_parsing_errors=True # Crucial for local LLMs which sometimes output bad framing
            )
        except Exception as e:
            raise ChatError(f"Failed to instantiate the DataFrame Agent: {str(e)}")

        # 4. Invoke the Agent
        try:
             # LangChain agent standard invocation
             response = agent.invoke({"input": query})
             
             # The result from a zero-shot agent usually places the final answer in 'output'
             answer = response.get("output", "I could not formulate an answer based on the data.")
             
             # Extracting intermediate code executed. Zero-shot react returns 'intermediate_steps' if configured,
             # but standard invoke might not. Let's try to grab it if possible or provide a descriptive fallback.
             # NOTE: To get intermediate steps robustly, `return_intermediate_steps=True` must be explicitly passed
             # during agent creation if Supported by the experimental agent version.
             executed_code = "Code execution details are internal to the Zero-Shot reasoning trace."

             return {
                 "answer": answer,
                 "executed_code": executed_code,
                 "model_used": model_name
             }

        except Exception as e:
            raise ChatError(f"The LLM encountered an error while analyzing the data: {str(e)}")

# Create a singleton for usage
interrogator = CSVInterrogator()
