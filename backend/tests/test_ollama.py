import os
import requests
from lib.ollama import get_ollama_models_names

ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def test_is_ollama_running():
    response = requests.get(f"{ollama_base_url}/api/tags")
    assert response.status_code == 200, "Ollama is not running"


def test_chat_completion():
    response = requests.post(
        f"{ollama_base_url}/api/generate",
        json={"model": "gemma3:1b", "prompt": "Hello, how are you?"},
    )
    assert response.status_code == 200, (
        f"Chat completion failed with status code {response.status_code}: {response.text}"
    )


def test_get_ollama_models_names():
    models = get_ollama_models_names()
    assert isinstance(models, list), "get_ollama_models_names() did not return a list"
    assert len(models) > 0, "No models found in Ollama instance"
    assert all(isinstance(model, str) for model in models), (
        "Some model names are not strings"
    )
    assert "qwen3:0.6b" in models, (
        "Required model 'qwen3:0.6b' not found in available models"
    )
    assert "gemma3:1b" in models, (
        "Required model 'gemma3:1b' not found in available models"
    )
