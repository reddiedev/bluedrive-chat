from lib.utils import is_session_id_valid


def test_valid_uuid():
    """Test that valid UUIDs are accepted."""
    valid_uuids = [
        "123e4567-e89b-12d3-a456-426614174000",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
        "550e8400-e29b-41d4-a716-446655440000",
    ]

    for uuid_str in valid_uuids:
        assert is_session_id_valid(uuid_str) is True


def test_invalid_uuid():
    """Test that invalid UUIDs are rejected."""
    invalid_uuids = [
        "not-a-uuid",
        "123e4567-e89b-12d3-a456",  # Incomplete UUID
        "123e4567-e89b-12d3-a456-426614174000-extra",  # Too long
        "",  # Empty string
        None,  # None value
        "123e4567-e89b-12d3-a456-42661417400g",  # Invalid character
        "123e4567-e89b-12d3-a456-42661417400",  # Missing character
    ]

    for uuid_str in invalid_uuids:
        assert is_session_id_valid(uuid_str) is False


def test_uuid_case_insensitive():
    """Test that UUID validation is case insensitive."""
    uuid_str = "123E4567-E89B-12D3-A456-426614174000"
    assert is_session_id_valid(uuid_str) is True


def test_uuid_without_hyphens():
    """Test that UUIDs without hyphens are rejected."""
    uuid_str = "123e4567e89b12d3a456426614174000"
    assert is_session_id_valid(uuid_str) is False
