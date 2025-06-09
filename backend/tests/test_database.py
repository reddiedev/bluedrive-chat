from lib.database import (
    get_db_connection,
)


def test_database_connection():
    """Test that we can connect to the database."""
    conn = get_db_connection()
    assert conn is not None
    conn.close()


def test_tables_exist():
    """Test that both required tables exist."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        # Check db_sessions table
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'db_sessions'
            );
        """)
        assert cur.fetchone()[0] is True

        # Check bd_chat_history table
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'bd_chat_history'
            );
        """)
        assert cur.fetchone()[0] is True
    conn.close()


def test_seed_data_in_sessions():
    """Test that seed data exists in db_sessions table."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM db_sessions")
        count = cur.fetchone()[0]
        assert count >= 10  # We know we have at least 10 seed records

        # Check specific seed record
        cur.execute("""
            SELECT username, title 
            FROM db_sessions 
            WHERE id = '123e4567-e89b-12d3-a456-426614174000'
        """)
        result = cur.fetchone()
        assert result is not None
        assert result[0] == "John Doe"
        assert result[1] == "🤖 Exploring AI and Machine Learning"
    conn.close()


def test_seed_data_in_chat_history():
    """Test that seed data exists in bd_chat_history table."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM bd_chat_history")
        count = cur.fetchone()[0]
        assert count >= 6  # We know we have at least 6 seed records

        # Check specific seed record
        cur.execute("""
            SELECT message 
            FROM bd_chat_history 
            WHERE session_id = '123e4567-e89b-12d3-a456-426614174000'
            ORDER BY created_at
            LIMIT 1
        """)
        result = cur.fetchone()
        assert result is not None
        message = result[0]
        assert message["type"] == "human"
        assert "Can you explain what machine learning is?" in message["data"]["content"]
    conn.close()
