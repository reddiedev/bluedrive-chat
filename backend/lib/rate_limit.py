import os

from psycopg import Connection

DEFAULT_MAX_MESSAGES = 20
DEFAULT_WINDOW_MINUTES = 5


def get_rate_limit_config() -> tuple[int, int] | None:
    """
    Reads the rate-limit configuration from the environment.

    `RATE_LIMIT_MAX_MESSAGES` is the number of messages a user may send within
    `RATE_LIMIT_WINDOW_MINUTES`. Setting either to 0 (or a non-numeric value)
    disables rate limiting.

    Returns:
        tuple[int, int] | None: (max_messages, window_seconds) when enabled,
        otherwise None.
    """
    try:
        max_messages = int(
            os.getenv("RATE_LIMIT_MAX_MESSAGES", str(DEFAULT_MAX_MESSAGES))
        )
        window_minutes = float(
            os.getenv("RATE_LIMIT_WINDOW_MINUTES", str(DEFAULT_WINDOW_MINUTES))
        )
    except ValueError:
        return None

    if max_messages <= 0 or window_minutes <= 0:
        return None

    return max_messages, int(window_minutes * 60)


def check_rate_limit(conn: Connection, username: str) -> int | None:
    """
    Records a message for `username` and enforces the rolling-window limit.

    Expired events are pruned first, then the user's messages within the window
    are counted. Under the limit, the new event is inserted and None is
    returned. At/over the limit, nothing is inserted and the number of seconds
    until the oldest event leaves the window is returned.

    Args:
        conn (Connection): The active database connection.
        username (str): The user the limit applies to (one budget across all
            of their chat threads).

    Returns:
        int | None: Seconds to wait before retrying when limited, else None.
    """
    config = get_rate_limit_config()
    if config is None:
        return None

    max_messages, window_seconds = config

    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM bd_rate_limit_events
            WHERE username = %s
              AND created_at < now() - make_interval(secs => %s)
            """,
            (username, window_seconds),
        )
        cur.execute(
            """
            SELECT count(*),
                   extract(epoch FROM (now() - min(created_at)))::int
            FROM bd_rate_limit_events
            WHERE username = %s
            """,
            (username,),
        )
        total, age_seconds = cur.fetchone()

        if total >= max_messages:
            conn.commit()
            return max(1, window_seconds - (age_seconds or 0))

        cur.execute(
            "INSERT INTO bd_rate_limit_events (username) VALUES (%s)",
            (username,),
        )
        conn.commit()

    return None


def rate_limit_message(retry_after: int) -> str:
    """User-facing message for a rejected request."""
    config = get_rate_limit_config()
    if config is None:
        return "Rate limit reached. Please try again later."

    max_messages, window_seconds = config
    window_minutes = window_seconds // 60
    unit = "minute" if window_minutes == 1 else "minutes"
    return (
        f"Rate limit reached: you can send {max_messages} messages every "
        f"{window_minutes} {unit}. Try again in {retry_after} seconds."
    )
