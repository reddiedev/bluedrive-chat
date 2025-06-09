import ulid
import uuid
from typing import Any


def is_session_id_valid(session_id: Any) -> bool:
    """
    Validates if a session ID is a valid UUID.

    Args:
        session_id (str): The session ID to validate.

    Returns:
        bool: True if the session ID is a valid UUID, False otherwise.
    """
    if not isinstance(session_id, str):
        return False

    try:
        val = uuid.UUID(session_id)
        # Optional: Ensure the string is in canonical form
        return str(val) == session_id.lower()
    except ValueError:
        return False


def generate_message_id():
    """
    Generates a new ULID for a message.

    Returns:
        str: A new ULID string.
    """
    return str(ulid.new())
