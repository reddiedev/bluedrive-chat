from fastapi import FastAPI, HTTPException, BackgroundTasks
import uvicorn
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_ollama.llms import OllamaLLM
from langchain_postgres import PostgresChatMessageHistory
import psycopg
from psycopg import Connection
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from urllib.parse import unquote
from lib.utils import generate_message_id, is_session_id_valid
from lib.types import ChatRequest, Session, MessageRecord, Message
import requests

load_dotenv(override=True)

## LLM START
system_prompt = """You are a helpful assistant."""
sys_msg = SystemMessage(content=system_prompt)


def get_session_title(usr_msg: str, model: str) -> str:
    title_sys_msg = SystemMessage(
        content="""
        You are a helpful assistant. You are tasked to generate a chat session title based on the user's first message. Follow these exact rules:
        
        1. Start with ONE emoji that clearly relates to the topic (do not use more than one emoji).
        2. Add a single space after the emoji.
        3. Write a clear, descriptive title (4-12 words) that summarizes the user's message.
        4. The title must be a meaningful phrase, not a single word or a random word.
        5. Do NOT use only emojis, random words, or generic words like "Title" or "Chat".
        6. Use the same language as the user's message.
        7. Make it concise, specific, and engaging.
        8. Do not use quotes, explanations, or extra text
        9. The title must not exceed 100 characters
        
        Common topic emojis to use:
        - 💻 for coding/programming
        - 📊 for data/analysis
        - 🤔 for questions/help
        - 📝 for writing
        - 🔍 for research
        - 💡 for ideas/creativity
        - 🎯 for goals/planning
        - 🛠️ for troubleshooting
        - 📚 for learning/education
        - 💬 for general chat
        
        Examples of good titles:
        - 💻 Python Script Debugging Help
        - 📊 Sales Data Analysis Question
        - 🤔 Career Change Advice Needed
        - 📝 Creative Writing Story Ideas
        - 🔍 Research Paper Topic Discussion
        
        Bad examples (do NOT do this):
        - 💻💻
        - 💡
        - 🤔 Question
        - 💬 Title
        - 📝 Chat
        - 💻 Python
        
        Respond with ONLY the emoji and the title, nothing else.
        """
    )
    prompt = ChatPromptTemplate.from_messages(
        [title_sys_msg, HumanMessage(content=usr_msg)]
    )
    model = OllamaLLM(
        model=model,
        base_url=os.getenv("OLLAMA_BASE_URL"),
    )
    chain = prompt | model
    response = chain.invoke({"content": usr_msg})
    return response


def get_ollama_models() -> list[dict]:
    response = requests.get(
        f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags"
    )
    models = response.json()["models"]
    return models


def get_ollama_models_names() -> list[str]:
    models = get_ollama_models()
    return [model["name"] for model in models]


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
            return Session(id=str(result[0]), title=result[2], username=result[1])
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
    f"postgresql://{os.getenv('POSTGRES_USER', 'myuser')}:{os.getenv('POSTGRES_PASSWORD', 'mypassword')}@{os.getenv('POSTGRES_HOST', 'localhost')}"
    f":{os.getenv('POSTGRES_PORT', 5432)}/{os.getenv('POSTGRES_DB', 'mydatabase')}"
)
sync_connection = psycopg.connect(CONNECTION_STRING)
PostgresChatMessageHistory.create_tables(sync_connection, table_name)
create_db_sessions_table(sync_connection)

## DATABASE END


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World!"}


@app.get("/health")
async def health():
    return {"message": "OK!"}


@app.get("/models")
async def get_models():
    try:
        return get_ollama_models()
    except Exception as e:
        print(f"Error in get_models: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/sessions")
async def get_sessions(name: str):
    formatted_name = unquote(name)

    try:
        with sync_connection.cursor() as cur:
            cur.execute(
                "SELECT id, username, title FROM db_sessions WHERE username = %s ORDER BY created_at DESC",
                (formatted_name,),
            )
            result = cur.fetchall()
            sync_connection.commit()  # Explicitly commit the transaction

            return [
                Session(id=str(row[0]), title=row[2], username=row[1]) for row in result
            ]
    except Exception as e:
        sync_connection.rollback()  # Rollback on error
        print(f"Database error in get_sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/session")
async def get_session(session_id: str):
    with sync_connection.cursor() as cur:
        cur.execute(
            "SELECT id, username, title FROM db_sessions WHERE id = %s",
            (session_id,),
        )
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Session not found")

        session = Session(id=str(result[0]), title=result[2], username=result[1])

        cur.execute(
            "SELECT * FROM bd_chat_history WHERE session_id = %s ORDER BY created_at ASC",
            (session_id,),
        )
        result = cur.fetchall()

        if not result:
            return {
                "session": session,
                "messages": [],
            }

        messages = [
            MessageRecord(
                id=row[0], session_id=str(row[1]), message=row[2], created_at=row[3]
            )
            for row in result
        ]

        formatted_messages = [
            Message(
                id=str(message.message["data"]["id"]),
                role=message.message["data"]["type"] == "human"
                and "user"
                or "assistant",
                content=message.message["data"]["content"],
                name=message.message["data"]["name"],
                created_at=message.created_at,
            )
            for message in messages
        ]
        return {
            "session": session,
            "messages": formatted_messages,
        }


@app.post("/chat")
async def chat(request: ChatRequest):
    # INPUT VALIDATION
    if not is_session_id_valid(request.session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if request.model not in get_ollama_models_names():
        raise HTTPException(status_code=400, detail="Invalid model")

    # SESSION HANDLING
    session = get_session_by_id(sync_connection, request.session_id)
    if not session:
        title = get_session_title(request.content, request.model)
        session = Session(id=request.session_id, title=title, username=request.name)
        create_session_if_not_exists(
            sync_connection, request.session_id, request.name, title
        )
    chat_history = PostgresChatMessageHistory(
        table_name, request.session_id, sync_connection=sync_connection
    )
    prev_messages = chat_history.get_messages()

    # CHAT COMPLETION
    new_usr_msg = HumanMessage(
        content=request.content, id=generate_message_id(), name=request.name
    )
    prompt = ChatPromptTemplate.from_messages([sys_msg] + prev_messages + [new_usr_msg])
    model = OllamaLLM(
        model=request.model,
        base_url=os.getenv("OLLAMA_BASE_URL"),
    )
    chain = prompt | model
    response = chain.invoke({"content": request.content})
    new_ai_msg = AIMessage(content=response, id=generate_message_id(), name="Assistant")

    # STORE MESSAGES
    chat_history.add_messages([new_usr_msg, new_ai_msg])

    return JSONResponse(content={"message": response})


@app.post("/stream")
async def stream(request: ChatRequest, background_tasks: BackgroundTasks):
    print(f"Stream Chat Request: #{request.session_id} from @{request.name}")

    # INPUT VALIDATION
    if not is_session_id_valid(request.session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if request.model not in get_ollama_models_names():
        raise HTTPException(status_code=400, detail="Invalid model")

    # SESSION HANDLING
    session = get_session_by_id(sync_connection, request.session_id)
    if not session:
        title = get_session_title(request.content, request.model)
        session = Session(id=request.session_id, title=title, username=request.name)
        create_session_if_not_exists(
            sync_connection, request.session_id, request.name, title
        )

    chat_history = PostgresChatMessageHistory(
        table_name, request.session_id, sync_connection=sync_connection
    )
    prev_messages = chat_history.get_messages()

    # CHAT COMPLETION
    new_usr_msg = HumanMessage(
        content=request.content, id=generate_message_id(), name=request.name
    )

    prompt = "\n".join(
        [sys_msg.content]
        + [msg.content for msg in prev_messages]
        + [new_usr_msg.content]
    )

    model_with_streaming = OllamaLLM(
        model=request.model,
        base_url=os.getenv("OLLAMA_BASE_URL"),
        streaming=True,
    )

    # RESPONSE STREAMING
    full_response = ""

    async def stream_response():
        nonlocal full_response
        async for token in model_with_streaming.astream(prompt):
            full_response += token
            yield token

    response = StreamingResponse(stream_response(), media_type="text/plain")

    # STORE MESSAGES
    async def store_messages():
        new_ai_msg = AIMessage(
            content=full_response, id=generate_message_id(), name="Assistant"
        )
        chat_history.add_messages([new_usr_msg, new_ai_msg])

    background_tasks.add_task(store_messages)

    return response


def validate_env_vars():
    if not os.getenv("OLLAMA_BASE_URL"):
        raise ValueError("OLLAMA_BASE_URL is not set")
    if not os.getenv("POSTGRES_HOST"):
        raise ValueError("POSTGRES_HOST is not set")
    if not os.getenv("POSTGRES_PORT"):
        raise ValueError("POSTGRES_PORT is not set")
    if not os.getenv("POSTGRES_DB"):
        raise ValueError("POSTGRES_DB is not set")
    if not os.getenv("POSTGRES_USER"):
        raise ValueError("POSTGRES_USER is not set")
    if not os.getenv("POSTGRES_PASSWORD"):
        raise ValueError("POSTGRES_PASSWORD is not set")
    print("✅ Environment variables validated")


def main():
    validate_env_vars()
    load_dotenv(override=True)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("BACKEND_PORT", 8000)),
        reload=True,
    )


if __name__ == "__main__":
    main()
