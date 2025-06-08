from fastapi import FastAPI, HTTPException
import uvicorn
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_ollama.llms import OllamaLLM
from langchain_postgres import PostgresChatMessageHistory
import psycopg
from psycopg import Connection
import os

from lib.utils import generate_message_id, is_session_id_valid
from lib.types import ChatRequest, Session, SessionsRequest


load_dotenv(override=True)

## LLM START
system_prompt = (
    """You are Qwen, created by Alibaba Cloud. You are a helpful assistant."""
)
sys_msg = SystemMessage(content=system_prompt)
model = OllamaLLM(
    model=os.getenv("OLLAMA_MODEL"), base_url=os.getenv("OLLAMA_BASE_URL")
)


def get_session_title(usr_msg: str) -> str:
    sys_msg = SystemMessage(
        content=f"""
        {system_prompt}
        The user will provide a message, and you will generate a title for the chat session.
        The title should be a single word or phrase that captures the essence of the user's message.
        The title should be in the same language as the user's message.
        The title should start with an emoji.
        The title should be no less than 10 words and no more than 100 characters.
        """
    )
    prompt = ChatPromptTemplate.from_messages([sys_msg, HumanMessage(content=usr_msg)])
    chain = prompt | model
    response = chain.invoke({"content": usr_msg})
    return response


## LLM END


## DATABASE START
def create_db_sessions_table(conn: Connection):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS db_sessions (
                id UUID PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def get_session_by_id(conn: Connection, session_id: str) -> Session | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, username, title FROM db_sessions WHERE id = %s
            """,
            (session_id,),
        )
        result = cur.fetchone()
        if result:
            return Session(id=result[0], title=result[2], username=result[1])
        return None


def create_session_if_not_exists(
    conn: Connection, session_id: str, user_name: str, session_title: str
):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO db_sessions (id, username, title)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (session_id, user_name, session_title),
        )
        conn.commit()


table_name = "bd_chat_history"
CONNECTION_STRING = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}"
    f":{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)
sync_connection = psycopg.connect(CONNECTION_STRING)
PostgresChatMessageHistory.create_tables(sync_connection, table_name)
create_db_sessions_table(sync_connection)

## DATABASE END


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World!"}


@app.get("/health")
async def health():
    return {"message": "OK!"}


@app.get("/sessions")
async def get_sessions(name: str):
    print(f"Received /sessions request for user: {name}")

    with sync_connection.cursor() as cur:
        cur.execute(
            "SELECT id, username, title FROM db_sessions",
        )
        result = cur.fetchall()
        print(f"Result: {result}")
        return [
            Session(id=str(row[0]), title=row[2], username=row[1]) for row in result
        ]


@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"Received request: {request}")

    if not is_session_id_valid(request.session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = get_session_by_id(sync_connection, request.session_id)
    if not session:
        title = get_session_title(request.content)
        session = Session(id=request.session_id, title=title, username=request.name)
        create_session_if_not_exists(
            sync_connection, request.session_id, request.name, title
        )

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

    return {
        "message": response,
        "session": session,
        "messages": chat_history.get_messages(),
    }


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=os.getenv("PORT", 8000), reload=True)


if __name__ == "__main__":
    main()
