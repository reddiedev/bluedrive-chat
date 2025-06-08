from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_ollama.llms import OllamaLLM
import os

system_prompt = (
    """You are Qwen, created by Alibaba Cloud. You are a helpful assistant."""
)


model = OllamaLLM(
    model=os.getenv("OLLAMA_MODEL"), base_url=os.getenv("OLLAMA_BASE_URL")
)


load_dotenv(override=True)


class ChatRequest(BaseModel):
    question: str


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health():
    return {"message": "OK"}


@app.post("/chat")
async def chat(request: ChatRequest):
    prompt = ChatPromptTemplate.from_messages(
        [SystemMessage(content=system_prompt), HumanMessage(content=request.question)]
    )
    chain = prompt | model

    response = chain.invoke({"question": request.question})
    print(response)
    return {"message": response}


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
