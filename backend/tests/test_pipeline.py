"""
Quick smoke test for the dual-agent pipeline.

Verifies:
1. LLMService can create both logic and summary LLM instances
2. CSVChatbot initializes with a DataFrame using both models
3. SessionManager creates sessions without requiring a model_name
4. Pipeline label is correct

NOTE: This test requires Ollama running with both models pulled:
  ollama pull qwen2.5-coder:7b
  ollama pull llama3.2
"""

import sys
import os

# Add the backend app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd


def test_llm_service_factories():
    """Test that both LLM factory methods create valid instances."""
    from app.services.llm_service import llm_service

    logic = llm_service.get_logic_llm()
    assert logic is not None, "Logic LLM should not be None"
    assert logic.model == "qwen2.5-coder:7b", f"Expected qwen2.5-coder:7b, got {logic.model}"
    print("✅ Logic LLM (Qwen 2.5 Coder) created successfully")

    summary = llm_service.get_summary_llm()
    assert summary is not None, "Summary LLM should not be None"
    assert summary.model == "llama3.2", f"Expected llama3.2, got {summary.model}"
    print("✅ Summary LLM (Llama 3.2) created successfully")


def test_session_creation():
    """Test that a session can be created without specifying a model."""
    from app.core.agent_engine import session_manager

    df = pd.DataFrame({
        "name": ["Alice", "Bob", "Charlie"],
        "score": [90, 75, 85],
    })

    session_id = session_manager.create_session(df=df)
    assert session_id is not None, "Session ID should not be None"
    print(f"✅ Session created: {session_id}")

    chatbot = session_manager.get_session(session_id)
    assert chatbot is not None
    assert chatbot.pipeline_label == "qwen2.5-coder:7b → llama3.2"
    print(f"✅ Pipeline label: {chatbot.pipeline_label}")

    # Cleanup
    session_manager.delete_session(session_id)
    print("✅ Session cleaned up")


def test_pipeline_ask():
    """Integration test: ask a real question and verify output quality."""
    from app.core.agent_engine import session_manager

    df = pd.DataFrame({
        "name": ["Alice", "Bob", "Charlie", "Diana"],
        "score": [90, 75, 85, 80],
    })

    session_id = session_manager.create_session(df=df)
    chatbot = session_manager.get_session(session_id)

    print("\n🔄 Asking: 'What is the average score?'")
    answer = chatbot.ask("What is the average score?")
    print(f"📝 Answer:\n{answer}\n")

    # Verify mathematical accuracy
    assert "82.5" in answer, f"Expected 82.5 in answer, got: {answer}"
    print("✅ Correct average (82.5) found in answer")

    # Verify no technical jargon leaked
    jargon = ["df[", "import ", ".mean()", "python", "pandas"]
    for term in jargon:
        assert term.lower() not in answer.lower(), f"Technical jargon leaked: '{term}' found in answer"
    print("✅ No technical jargon detected in answer")

    session_manager.delete_session(session_id)
    print("✅ Pipeline test passed!")


if __name__ == "__main__":
    print("=" * 50)
    print("Dual-Agent Pipeline Smoke Test")
    print("=" * 50)

    try:
        print("\n--- Test 1: LLM Service Factories ---")
        test_llm_service_factories()

        print("\n--- Test 2: Session Creation ---")
        test_session_creation()

        print("\n--- Test 3: Pipeline Ask (integration) ---")
        test_pipeline_ask()

        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 50)

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
