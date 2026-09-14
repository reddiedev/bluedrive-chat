import uuid

from fastapi.testclient import TestClient

from lib.database import get_connection
from lib.llm import get_default_model
from lib.rate_limit import check_rate_limit, get_rate_limit_config
from main import app

client = TestClient(app)

TEST_MODEL = get_default_model()


def unique_username() -> str:
    """Fresh username per test so leftover rows never collide."""
    return f"ratelimit-{uuid.uuid4()}"


def clear_events(username: str):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM bd_rate_limit_events WHERE username = %s", (username,))
    conn.commit()


def test_config_defaults(monkeypatch):
    monkeypatch.delenv("RATE_LIMIT_MAX_MESSAGES", raising=False)
    monkeypatch.delenv("RATE_LIMIT_WINDOW_MINUTES", raising=False)
    assert get_rate_limit_config() == (20, 300)


def test_config_disabled_when_zero(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "0")
    assert get_rate_limit_config() is None

    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "10")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_MINUTES", "0")
    assert get_rate_limit_config() is None


def test_config_disabled_when_invalid(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "many")
    assert get_rate_limit_config() is None


def test_allows_messages_under_limit(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "3")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_MINUTES", "5")
    username = unique_username()
    conn = get_connection()
    try:
        assert check_rate_limit(conn, username) is None
        assert check_rate_limit(conn, username) is None
        assert check_rate_limit(conn, username) is None

        # Fourth message in the window is rejected with a retry-after.
        retry_after = check_rate_limit(conn, username)
        assert retry_after is not None
        assert 0 < retry_after <= 300
    finally:
        clear_events(username)


def test_disabled_limit_never_blocks(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "0")
    username = unique_username()
    conn = get_connection()
    try:
        for _ in range(5):
            assert check_rate_limit(conn, username) is None
    finally:
        clear_events(username)


def test_chat_endpoint_returns_429(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "1")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_MINUTES", "5")
    username = unique_username()
    conn = get_connection()
    try:
        # Consume the single allowed slot, then the endpoint should reject.
        assert check_rate_limit(conn, username) is None

        response = client.post(
            "/chat",
            json={
                "name": username,
                "session_id": str(uuid.uuid4()),
                "content": "This should be rate limited",
                "model": TEST_MODEL,
            },
        )

        assert response.status_code == 429
        assert response.headers["retry-after"].isdigit()
        assert "Rate limit reached" in response.json()["detail"]
    finally:
        clear_events(username)


def test_stream_endpoint_returns_429(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_MAX_MESSAGES", "1")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_MINUTES", "5")
    username = unique_username()
    conn = get_connection()
    try:
        assert check_rate_limit(conn, username) is None

        response = client.post(
            "/stream",
            json={
                "name": username,
                "session_id": str(uuid.uuid4()),
                "content": "This should be rate limited",
                "model": TEST_MODEL,
            },
        )

        assert response.status_code == 429
        assert response.headers["retry-after"].isdigit()
        assert "Rate limit reached" in response.json()["detail"]
    finally:
        clear_events(username)
