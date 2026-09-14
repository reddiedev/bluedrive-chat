import os
import psycopg
from psycopg import Connection
from lib.types import Session

# Database configuration
table_name = "bd_chat_history"

_sync_connection: Connection | None = None


def get_db_connection() -> Connection:
    """
    Creates and returns a new database connection.

    The schema is managed by Supabase migrations (see supabase/migrations), so no
    tables are created here.

    Returns:
        Connection: An active database connection
    """
    if not os.getenv("DATABASE_URL"):
        raise ValueError("DATABASE_URL is not set")
    # prepare_threshold=None keeps psycopg's automatic prepared statements disabled,
    # which is required for Supabase's transaction pooler and harmless elsewhere.
    return psycopg.connect(os.getenv("DATABASE_URL"), prepare_threshold=None)


def get_connection() -> Connection:
    """
    Returns a live module-level connection, reconnecting if the existing one has
    been closed or dropped by the server (e.g. an idle connection reaped by Supabase).

    Returns:
        Connection: An active database connection
    """
    global _sync_connection

    if _sync_connection is None or _sync_connection.closed:
        _sync_connection = get_db_connection()
        return _sync_connection

    try:
        with _sync_connection.cursor() as cur:
            cur.execute("SELECT 1")
        _sync_connection.commit()
    except psycopg.Error:
        _sync_connection = get_db_connection()

    return _sync_connection


def get_session_by_id(conn: Connection, session_id: str) -> Session | None:
    """
    Retrieve a session from the database by its unique session ID.

    Args:
        conn (Connection): The active database connection.
        session_id (str): The UUID of the session to retrieve.

    Returns:
        Session | None: The Session object if found, otherwise None.
    """
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
    """
    Create a new session in the database if it does not exist.

    Args:
        conn (Connection): The active database connection.
        session_id (str): The UUID of the session to create.
        user_name (str): The username of the user creating the session.
        session_title (str): The title of the session.
    """
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
