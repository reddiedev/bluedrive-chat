import os
import re
import requests
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from lib.prompts import title_sys_msg

load_dotenv()

DEFAULT_PROVIDER = "openai"
DEFAULT_OPENAI_BASE_URL = "https://api.fireworks.ai/inference/v1"
DEFAULT_OPENAI_MODEL = "accounts/fireworks/models/deepseek-v4p1-flash"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "gemma3:1b"


def get_provider() -> str:
    """Returns the configured LLM provider, either `openai` or `ollama`."""
    return os.getenv("LLM_PROVIDER", DEFAULT_PROVIDER).lower()


def get_default_model() -> str:
    if get_provider() == "ollama":
        return os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
    return os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)


def get_chat_model(model: str, streaming: bool = False):
    """
    Returns a LangChain chat model for the configured provider.

    `openai` targets any OpenAI-compatible endpoint (e.g. Fireworks AI), while
    `ollama` targets a local Ollama server. Both expose the same chat interface,
    so callers can invoke/stream messages and read `chunk.content`.
    """
    if get_provider() == "ollama":
        return ChatOllama(
            model=model,
            base_url=os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL),
            streaming=streaming,
        )

    return ChatOpenAI(
        model=model,
        base_url=os.getenv("OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL),
        api_key=os.getenv("OPENAI_API_KEY"),
        streaming=streaming,
    )


_VERSION_RE = re.compile(r"^v(\d+)(?:p(\d+))?$", re.IGNORECASE)
_SIZE_RE = re.compile(r"^[a-z]?\d+(?:\.\d+)?(?:x\d+)?b$", re.IGNORECASE)
_ACRONYMS = {"gpt": "GPT", "oss": "OSS", "ai": "AI", "llm": "LLM", "moe": "MoE", "rag": "RAG"}


def _default_display_name(model_id: str) -> str:
    """
    Readable name for a provider model id, used when none is configured.
    Overridable per model via `OPENAI_MODELS` (`model-id=Display name`).

    `accounts/fireworks/models/deepseek-v4p1-flash` -> `Deepseek V4.1 Flash`
    `accounts/fireworks/models/llama-v3p1-8b-instruct` -> `Llama V3.1 8B Instruct`
    """
    slug = model_id.rstrip("/").rsplit("/", 1)[-1]
    words = []
    for token in re.split(r"[-_]", slug):
        if not token:
            continue
        version = _VERSION_RE.match(token)
        if version:
            point = f".{version.group(2)}" if version.group(2) else ""
            words.append(f"V{version.group(1)}{point}")
        elif _SIZE_RE.match(token):
            words.append(token.upper())
        else:
            words.append(_ACRONYMS.get(token.lower(), token.capitalize()))
    return " ".join(words) or model_id


def _parse_openai_models(configured: str) -> list[dict]:
    """
    Parses `OPENAI_MODELS`, where each comma-separated entry is either
    `model` or `model=Display name`.
    """
    parsed = []
    for entry in configured.split(","):
        entry = entry.strip()
        if not entry:
            continue
        model_id, _, label = entry.partition("=")
        model_id = model_id.strip()
        label = label.strip()
        parsed.append(
            {"name": label or _default_display_name(model_id), "model": model_id}
        )
    return parsed


def get_models() -> list[dict]:
    """
    Retrieves the available models for the configured provider in a normalized
    `{"name": ..., "model": ...}` shape used by the frontend. `model` is the id
    sent to the provider; `name` is what the interface displays.

    For the OpenAI-compatible provider, the models are taken from the optional
    `OPENAI_MODELS` (comma-separated) env var, falling back to `OPENAI_MODEL`.
    Each entry may carry a display name after `=`.
    """
    if get_provider() == "ollama":
        response = requests.get(
            f"{os.getenv('OLLAMA_BASE_URL', DEFAULT_OLLAMA_BASE_URL)}/api/tags"
        )
        response.raise_for_status()
        models = response.json().get("models", [])
        return [
            {
                "name": model.get("name", model.get("model")),
                "model": model.get("model", model.get("name")),
            }
            for model in models
        ]

    configured = os.getenv("OPENAI_MODELS")
    if configured:
        return _parse_openai_models(configured)

    model_id = get_default_model()
    return [{"name": _default_display_name(model_id), "model": model_id}]


def get_models_names() -> list[str]:
    return [model["model"] for model in get_models()]


def extract_text(content) -> str:
    """Normalizes chat model output to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in content
        )
    return str(content)


def get_session_title(usr_msg: str, model: str | None = None) -> str:
    messages = [title_sys_msg, HumanMessage(content=usr_msg)]
    chat_model = get_chat_model(model or get_default_model())
    response = extract_text(chat_model.invoke(messages).content)

    # Ensure the title never exceeds 255 characters
    if len(response) > 255:
        return response[:200]

    return response
