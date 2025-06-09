from lib.database import (
    get_db_connection,
    get_session_by_id,
    create_session_if_not_exists,
)


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
