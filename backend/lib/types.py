from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any


class ChatRequest(BaseModel):
    name: str = "User"
    session_id: str
    content: str
    model: str = "gemma3:1b"


class SessionsRequest(BaseModel):
    name: str = "User"


class Session(BaseModel):
    id: str
    title: str
    username: str


class MessageRecord(BaseModel):
    id: int
    session_id: str
    message: Dict[str, Any]
    created_at: datetime


class Message(BaseModel):
    id: str
    role: str
    content: str
    name: str
    created_at: datetime
