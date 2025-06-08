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
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote

from lib.utils import generate_message_id, is_session_id_valid
from lib.types import ChatRequest, Session, MessageRecord, Message


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
        content="""
        You are Qwen, created by Alibaba Cloud. You are a helpful assistant. You are tasked to generate a chat session title based on the user's first message. Follow these exact rules:
        
        1. Start with ONE emoji that clearly relates to the topic (do not use more than one emoji).
        2. Add a single space after the emoji.
        3. Write a clear, descriptive title (4-12 words) that summarizes the user's message.
        4. The title must be a meaningful phrase, not a single word or a random word.
        5. Do NOT use only emojis, random words, or generic words like "Title" or "Chat".
        6. Use the same language as the user's message.
        7. Make it concise, specific, and engaging.
        8. Do not use quotes, explanations, or extra text.
        
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
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}"
    f":{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)
sync_connection = psycopg.connect(CONNECTION_STRING)
PostgresChatMessageHistory.create_tables(sync_connection, table_name)
create_db_sessions_table(sync_connection)

## DATABASE END


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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


@app.get("/sessions")
async def get_sessions(name: str):
    formatted_name = unquote(name)

    with sync_connection.cursor() as cur:
        cur.execute(
            "SELECT id, username, title FROM db_sessions WHERE username = %s ORDER BY created_at DESC",
            (formatted_name,),
        )
        result = cur.fetchall()

        return [
            Session(id=str(row[0]), title=row[2], username=row[1]) for row in result
        ]


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

    new_usr_msg = HumanMessage(
        content=request.content, id=generate_message_id(), name=request.name
    )
    prompt = ChatPromptTemplate.from_messages([sys_msg] + prev_messages + [new_usr_msg])
    chain = prompt | model

    response = chain.invoke({"content": request.content})
    new_ai_msg = AIMessage(content=response, id=generate_message_id(), name="Assistant")

    chat_history.add_messages([new_usr_msg, new_ai_msg])

    return {
        "message": response,
        "session": session,
        "messages": chat_history.get_messages(),
    }


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=os.getenv("PORT", 8000), reload=True)


if __name__ == "__main__":
    main()
