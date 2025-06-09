import ulid
import uuid


def is_session_id_valid(session_id: str) -> bool:
    """
    Validates if a session ID is a valid UUID.

    Args:
        session_id (str): The session ID to validate.

    Returns:
        bool: True if the session ID is a valid UUID, False otherwise.
    """
    try:
        uuid.UUID(session_id)
        return True
    except ValueError:
        return False


def generate_message_id():
    """
    Generates a new ULID for a message.

    Returns:
        str: A new ULID string.
    """
    return str(ulid.new())
