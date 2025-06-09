from lib.ollama import get_session_title


def test_title_generation():
    """Test title generation with various user messages."""
    test_cases = [
        {
            "message": "Can you help me debug this Python script that's not working?",
            "expected_words": 4,
            "max_length": 100,
        },
        {
            "message": "I need to analyze some sales data from last quarter",
            "expected_words": 4,
            "max_length": 100,
        },
        {
            "message": "What are the best practices for writing clean code?",
            "expected_words": 4,
            "max_length": 100,
        },
        {
            "message": "I'm having trouble with my React components not rendering properly",
            "expected_words": 4,
            "max_length": 100,
        },
        {
            "message": "Can you help me brainstorm some ideas for my next project?",
            "expected_words": 4,
            "max_length": 100,
        },
    ]

    for test_case in test_cases:
        title = get_session_title(test_case["message"], "llama3.2:1b")

        # Test emoji presence (check if first character is an emoji)
        assert len(title) > 0, "Title should not be empty"
        first_char = title[0]
        assert ord(first_char) > 0x1F300, "First character should be an emoji"

        # Test word count
        words = title.split()
        assert len(words) >= test_case["expected_words"], (
            f"Title should have at least {test_case['expected_words']} words"
        )

        # Test length
        assert len(title) <= test_case["max_length"], (
            f"Title should not exceed {test_case['max_length']} characters"
        )

        # Test format (emoji + space + words)
        assert title[1] == " ", "There should be a space after the emoji"

        # Test no quotes or extra text
        assert not any(char in title for char in ['"', "'", "`"]), (
            "Title should not contain quotes"
        )

        # Test meaningful content
        assert len(words) > 1, "Title should contain more than just an emoji"
