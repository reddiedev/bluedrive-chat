from fastapi.testclient import TestClient
from main import app
import time
import uuid
from dotenv import load_dotenv
from lib.database import sync_connection
import contextlib

load_dotenv()

client = TestClient(app)

# Test data
VALID_SESSION_ID = str(uuid.uuid4())
TEST_USERNAME = "testuser"
TEST_MODEL = "gemma3:1b"  # Using the default model from types.py


# Database transaction handling
@contextlib.contextmanager
def transaction():
    """Context manager for database transactions"""
    try:
        yield
        sync_connection.commit()
    except Exception:
        sync_connection.rollback()
        raise


# Health Check Tests
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"message": "OK!"}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World!"}


# Models Endpoint Tests
def test_get_models():
    response = client.get("/models")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0


# Sessions Endpoint Tests
def test_get_sessions():
    with transaction():
        response = client.get(f"/sessions?name={TEST_USERNAME}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_get_sessions_invalid_name():
    with transaction():
        response = client.get("/sessions?name=")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# Session Endpoint Tests
def test_get_session():
    with transaction():
        response = client.get(f"/session?session_id={VALID_SESSION_ID}")
        assert response.status_code == 404  # Should be 404 since session doesn't exist


def test_get_session_invalid_id():
    with transaction():
        response = client.get("/session?session_id=invalid-uuid")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid session ID"


# Chat Endpoint Tests
def test_chat_endpoint():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            "session_id": VALID_SESSION_ID,
            "content": "Hello, this is a test message",
            "model": TEST_MODEL,
        }
        response = client.post("/chat", json=chat_request)
        assert response.status_code == 200
        assert "message" in response.json()


def test_chat_endpoint_invalid_session():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            "session_id": "invalid-uuid",
            "content": "Hello, this is a test message",
            "model": TEST_MODEL,
        }
        response = client.post("/chat", json=chat_request)
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid session ID"


def test_chat_endpoint_invalid_model():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            "session_id": VALID_SESSION_ID,
            "content": "Hello, this is a test message",
            "model": "non-existent-model",
        }
        response = client.post("/chat", json=chat_request)
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid model"


# Stream Endpoint Tests
def test_stream_endpoint():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            "session_id": VALID_SESSION_ID,
            "content": "Hello, this is a test message",
            "model": TEST_MODEL,
        }
        response = client.post("/stream", json=chat_request)
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"


def test_stream_endpoint_invalid_session():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            "session_id": "invalid-uuid",
            "content": "Hello, this is a test message",
            "model": TEST_MODEL,
        }
        response = client.post("/stream", json=chat_request)
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid session ID"


# Unknown Endpoint Tests
def test_unknown_endpoint():
    response = client.get("/unknown-endpoint")
    assert response.status_code == 404


def test_unknown_method():
    response = client.put("/health")
    assert response.status_code == 405


# Load Testing
def test_concurrent_requests():
    """Test handling of concurrent requests to the health endpoint"""
    import threading
    import queue

    results = queue.Queue()
    num_requests = 10

    def make_request():
        response = client.get("/health")
        results.put(response.status_code)

    threads = []
    for _ in range(num_requests):
        thread = threading.Thread(target=make_request)
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    # Check all responses
    while not results.empty():
        status_code = results.get()
        assert status_code == 200


def test_response_time():
    """Test response time for health endpoint"""
    start_time = time.time()
    response = client.get("/health")
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 1.0  # Response should be under 1 second


# Error Handling Tests
def test_malformed_json():
    with transaction():
        response = client.post(
            "/chat",
            content="invalid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422


def test_missing_required_fields():
    with transaction():
        chat_request = {
            "name": TEST_USERNAME,
            # Missing session_id and content
            "model": TEST_MODEL,
        }
        response = client.post("/chat", json=chat_request)
        assert response.status_code == 422


def test_invalid_content_type():
    with transaction():
        response = client.post(
            "/chat", content="plain text", headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 422
