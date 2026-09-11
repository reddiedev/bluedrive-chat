import os
import pytest
import requests
from lib.llm import get_models_names, get_default_model

provider = os.getenv("LLM_PROVIDER", "openai").lower()


def test_get_models_names():
    models = get_models_names()
    assert isinstance(models, list), "get_models_names() did not return a list"
    assert len(models) > 0, "No models found for the configured provider"
    assert all(isinstance(model, str) for model in models), (
        "Some model names are not strings"
    )
    assert get_default_model() in models, "Default model is not in the models list"


@pytest.mark.skipif(provider != "ollama", reason="requires LLM_PROVIDER=ollama")
def test_is_ollama_running():
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    response = requests.get(f"{base_url}/api/tags")
    assert response.status_code == 200, "Ollama is not running"


@pytest.mark.skipif(provider == "ollama", reason="requires an OpenAI-compatible provider")
def test_openai_provider_configured():
    assert os.getenv("OPENAI_API_KEY"), "OPENAI_API_KEY is not set"
