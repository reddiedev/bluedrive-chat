import os
import psycopg
from psycopg import Connection
from lib.types import Session
from langchain_postgres import PostgresChatMessageHistory

# Database configuration
table_name = "bd_chat_history"
CONNECTION_STRING = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'myuser')}:{os.getenv('POSTGRES_PASSWORD', 'mypassword')}@{os.getenv('POSTGRES_HOST', 'localhost')}"
    f":{os.getenv('POSTGRES_PORT', 5432)}/{os.getenv('POSTGRES_DB', 'mydatabase')}"
)


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


def get_db_connection() -> Connection:
    """
    Creates and returns a database connection, initializing required tables.

    Returns:
        Connection: An active database connection
    """
    connection = psycopg.connect(CONNECTION_STRING)
    PostgresChatMessageHistory.create_tables(connection, table_name)
    create_db_sessions_table(connection)
    return connection


# Initialize the connection
sync_connection = get_db_connection()
