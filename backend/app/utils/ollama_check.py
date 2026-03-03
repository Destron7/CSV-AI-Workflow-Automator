import requests
import json

def test_ollama_connection(model_name="qwen2.5-coder:7b"):
    base_url = "http://localhost:11434"
    print(f"--- 🩺 Starting Ollama Diagnostics ---")
    
    # 1. Check if the Service is up
    try:
        response = requests.get(base_url)
        print(f"✅ Service: Ollama is running at {base_url}")
    except requests.exceptions.ConnectionError:
        print(f"❌ Service: Connection Refused! Is the Ollama app open?")
        print(f"   👉 Tip: Look for the Ollama icon in your Windows Taskbar tray.")
        return

    # 2. Check if the Model is downloaded
    try:
        tags_response = requests.get(f"{base_url}/api/tags")
        available_models = [m['name'] for m in tags_response.json().get('models', [])]
        
        if model_name in available_models or any(model_name in m for m in available_models):
            print(f"✅ Model: '{model_name}' found locally.")
        else:
            print(f"⚠️  Model: '{model_name}' NOT found.")
            print(f"   Available models: {available_models}")
            print(f"   👉 Run: 'ollama pull {model_name}' in your terminal.")
    except Exception as e:
        print(f"❌ Error checking models: {e}")

    # 3. Test a simple Chat Generation
    print(f"--- 💬 Testing Model Inference ---")
    payload = {
        "model": model_name,
        "prompt": "Say 'Ollama is online' if you can read this.",
        "stream": False
    }
    
    try:
        res = requests.post(f"{base_url}/api/generate", json=payload, timeout=10)
        if res.status_code == 200:
            print(f"✅ Inference: {res.json().get('response')}")
        else:
            print(f"❌ Inference Failed: {res.text}")
    except requests.exceptions.Timeout:
        print("❌ Inference Timeout: The model is taking too long to load (check your RAM/GPU).")
    except Exception as e:
        print(f"❌ Unknown Error: {e}")

if __name__ == "__main__":
    # Replace with whatever model you have downloaded (e.g., 'mistral' or 'qwen2.5-coder')
    test_ollama_connection("qwen2.5-coder:7b")