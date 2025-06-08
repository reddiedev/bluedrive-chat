from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_ollama.llms import OllamaLLM
from langchain_postgres import PostgresChatMessageHistory
import psycopg
import os
import uuid


def generate_session_id():
    return str(uuid.uuid4())


def generate_message_id():
    return str(uuid.uuid4())


load_dotenv(override=True)

system_prompt = (
    """You are Qwen, created by Alibaba Cloud. You are a helpful assistant."""
)
model = OllamaLLM(
    model=os.getenv("OLLAMA_MODEL"), base_url=os.getenv("OLLAMA_BASE_URL")
)

CONNECTION_STRING = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}"
    f":{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)

table_name = "bd_chat_history"
sync_connection = psycopg.connect(CONNECTION_STRING)
PostgresChatMessageHistory.create_tables(sync_connection, table_name)


class ChatRequest(BaseModel):
    name: str = "User"
    session_id: str
    content: str


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health():
    return {"message": "OK"}


sys_msg = SystemMessage(content=system_prompt)


@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"Received request: {request}")

    chat_history = PostgresChatMessageHistory(
        table_name, request.session_id, sync_connection=sync_connection
    )
    prev_messages = chat_history.get_messages()
    print(f"Previous messages: {prev_messages}")

    new_usr_msg = HumanMessage(
        content=request.content, id=generate_message_id(), name=request.name
    )
    prompt = ChatPromptTemplate.from_messages([sys_msg] + prev_messages + [new_usr_msg])
    chain = prompt | model

    response = chain.invoke({"content": request.content})
    new_ai_msg = AIMessage(content=response, id=generate_message_id(), name="Assistant")

    chat_history.add_messages([new_usr_msg, new_ai_msg])
    print(f"Response: {response}")

    return {"message": response}


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
