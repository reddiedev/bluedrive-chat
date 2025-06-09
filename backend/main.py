from fastapi import FastAPI, HTTPException, BackgroundTasks
import uvicorn
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_ollama.llms import OllamaLLM
from langchain_postgres import PostgresChatMessageHistory
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from urllib.parse import unquote

from lib.utils import generate_message_id, is_session_id_valid
from lib.types import ChatRequest, Session, MessageRecord, Message
from lib.ollama import get_ollama_models, get_ollama_models_names, get_session_title
from lib.prompts import chat_sys_msg
from lib.database import (
    get_session_by_id,
    create_session_if_not_exists,
    sync_connection,
    table_name,
)

load_dotenv()

# For testing purposes, CORS middleware is configured to allow all origins.
# This is convenient for local development and testing, but should be restricted
# to specific origins in production for better security. Securing CORS is not
# part of the current project scope.

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
    """
    Healthcheck endpoint for Docker and orchestration systems.

    Returns a simple JSON response indicating the backend is running.
    This endpoint is used by Docker, Kubernetes, or other orchestration tools
    to verify that the FastAPI service is healthy and ready to receive traffic.

    Returns:
        dict: {"message": "OK!"}
    """
    return {"message": "OK!"}


@app.get("/models")
async def get_models():
    """
    Retrieves the list of available models from the Ollama backend for use in the frontend

    Returns:
        list[dict]: A list of available model dictionaries.
    """
    try:
        return get_ollama_models()
    except Exception as e:
        print(f"Error in get_models: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/sessions")
async def get_sessions(name: str):
    """
    Retrieves the list of sessions for a given user from the database.

    Args:
        name (str): The username of the user to retrieve sessions for.

    Returns:
        list[Session]: A list of Session objects.
    """
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
    """
    Retrieves a specific session and its chat history from the database.

    Args:
        session_id (str): The UUID of the session to retrieve.

    Returns:
        dict: A dictionary containing the session and its chat history.
    """
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
    """
    Handles a chat request by validating the session ID, model, and creating a new session if needed.
    It then adds the user's message to the chat history and generates a response using the selected model.

    Args:
        request (ChatRequest): The chat request containing session ID, model, and content.

    Returns:
        JSONResponse: A JSON response containing the generated response.
    """
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
    prompt = ChatPromptTemplate.from_messages(
        [chat_sys_msg] + prev_messages + [new_usr_msg]
    )
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
    """
    Handles a streaming chat request by validating the session ID, model, and creating a new session if needed.
    It then adds the user's message to the chat history and generates a response using the selected model.

    Args:
        request (ChatRequest): The chat request containing session ID, model, and content.
        background_tasks (BackgroundTasks): The background tasks to handle the streaming response.

    Returns:
        StreamingResponse: A streaming response containing the generated response.
    """
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

    messages = (
        [SystemMessage(content=chat_sys_msg.content)] + prev_messages + [new_usr_msg]
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
        async for token in model_with_streaming.astream(messages):
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
    """
    Validates that all required environment variables are set.

    Raises ValueError if any required environment variable is not set.
    """
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
    load_dotenv()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("BACKEND_PORT", 8000)),
        reload=True,
    )


if __name__ == "__main__":
    main()
