import os
import requests
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langchain_ollama.llms import OllamaLLM

from lib.prompts import title_sys_msg

load_dotenv()


def get_ollama_models() -> list[dict]:
    """
    Retrieves the list of available models from the Ollama backend.
    This function queries the Ollama API to check which models are available for chat completions and inferences.
    """
    response = requests.get(
        f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags"
    )
    models = response.json()["models"]
    return models


def get_ollama_models_names() -> list[str]:
    models = get_ollama_models()
    return [model["name"] for model in models]


def get_session_title(usr_msg: str) -> str:
    prompt = ChatPromptTemplate.from_messages(
        [title_sys_msg, HumanMessage(content=usr_msg)]
    )
    model = OllamaLLM(
        model="gemma3:1b",
        base_url=os.getenv("OLLAMA_BASE_URL"),
    )
    chain = prompt | model
    response = chain.invoke({"content": usr_msg})

    # Ensure the title never exceeds 255 characters
    if len(response) > 255:
        return response[:200]

    return response
