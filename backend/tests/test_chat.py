from lib.database import (
    get_db_connection,
    get_session_by_id,
    create_session_if_not_exists,
)
from langchain_postgres import PostgresChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
import uuid


def test_session_operations():
    """Test basic session operations."""
    conn = get_db_connection()

    # Test get_session_by_id
    session = get_session_by_id(conn, "123e4567-e89b-12d3-a456-426614174000")
    assert session is not None
    assert session.username == "John Doe"
    assert session.title == "🤖 Exploring AI and Machine Learning"

    # Test create_session_if_not_exists
    test_id = "123e4567-e89b-12d3-a456-426614174999"
    create_session_if_not_exists(conn, test_id, "Test User", "Test Session")

    # Verify the new session was created
    session = get_session_by_id(conn, test_id)
    assert session is not None
    assert session.username == "Test User"
    assert session.title == "Test Session"

    # Clean up
    with conn.cursor() as cur:
        cur.execute("DELETE FROM db_sessions WHERE id = %s", (test_id,))
        conn.commit()

    conn.close()


def test_duplicate_session_creation():
    """Test that creating a duplicate session does not throw an error and returns existing session."""
    conn = get_db_connection()

    # First create a test session
    test_id = "123e4567-e89b-12d3-a456-426614174999"
    create_session_if_not_exists(conn, test_id, "Test User", "Test Session")

    # Try to create the same session again with different data
    create_session_if_not_exists(conn, test_id, "Different User", "Different Title")

    # Verify the original session data is preserved
    session = get_session_by_id(conn, test_id)
    assert session is not None
    assert session.username == "Test User"
    assert session.title == "Test Session"

    # Clean up
    with conn.cursor() as cur:
        cur.execute("DELETE FROM db_sessions WHERE id = %s", (test_id,))
        conn.commit()

    conn.close()


def test_message_history_operations():
    """Test message history operations including adding and retrieving messages."""
    conn = get_db_connection()
    test_id = str(uuid.uuid4())

    # Create a test session
    create_session_if_not_exists(conn, test_id, "Test User", "Test Session")

    # Initialize message history
    message_history = PostgresChatMessageHistory(
        "bd_chat_history",
        test_id,
        sync_connection=conn,
    )

    # Add some test messages
    test_messages = [
        HumanMessage(content="Hello, how are you?"),
        AIMessage(content="I'm doing well, thank you!"),
        HumanMessage(content="What's the weather like?"),
        AIMessage(content="I don't have access to real-time weather data."),
    ]

    # Add messages to history
    for message in test_messages:
        message_history.add_message(message)

    # Retrieve messages
    retrieved_messages = message_history.messages

    # Verify message count
    assert len(retrieved_messages) == len(test_messages)

    # Verify message content and order
    for original, retrieved in zip(test_messages, retrieved_messages):
        assert original.content == retrieved.content
        assert original.type == retrieved.type

    # Clean up
    with conn.cursor() as cur:
        cur.execute("DELETE FROM db_sessions WHERE id = %s", (test_id,))
        cur.execute("DELETE FROM bd_chat_history WHERE session_id = %s", (test_id,))
        conn.commit()

    conn.close()


def test_message_history_persistence():
    """Test that messages persist across different connections."""
    # First connection
    conn1 = get_db_connection()
    test_id = str(uuid.uuid4())

    # Create a test session
    create_session_if_not_exists(conn1, test_id, "Test User", "Test Session")

    # Initialize message history and add messages
    message_history1 = PostgresChatMessageHistory(
        "bd_chat_history",
        test_id,
        sync_connection=conn1,
    )

    test_message = HumanMessage(content="This is a test message")
    message_history1.add_message(test_message)

    # Close first connection
    conn1.close()

    # Second connection
    conn2 = get_db_connection()
    message_history2 = PostgresChatMessageHistory(
        "bd_chat_history",
        test_id,
        sync_connection=conn2,
    )

    # Retrieve messages
    retrieved_messages = message_history2.messages

    # Verify message persistence
    assert len(retrieved_messages) == 1
    assert retrieved_messages[0].content == test_message.content
    assert retrieved_messages[0].type == test_message.type

    # Clean up
    with conn2.cursor() as cur:
        cur.execute("DELETE FROM db_sessions WHERE id = %s", (test_id,))
        cur.execute("DELETE FROM bd_chat_history WHERE session_id = %s", (test_id,))
        conn2.commit()

    conn2.close()
