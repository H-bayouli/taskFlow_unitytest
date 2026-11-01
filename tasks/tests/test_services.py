import pytest

from tasks.services import (
    calculate_priority_score,
    validate_task_title,
)


@pytest.mark.parametrize(
    ("priority", "expected_score"),
    [
        ("low", 1),
        ("medium", 2),
        ("high", 3),
    ],
)
def test_calculate_priority_score(priority, expected_score):
    assert calculate_priority_score(priority) == expected_score


@pytest.mark.parametrize("priority", ["urgent", "", None, "HIGH"])
def test_invalid_priority_raises_error(priority):
    with pytest.raises(ValueError, match="Invalid priority"):
        calculate_priority_score(priority)


def test_title_is_trimmed():
    assert validate_task_title("  Write tests  ") == "Write tests"


@pytest.mark.parametrize("title", ["", "  ", "ab"])
def test_title_shorter_than_three_characters_is_rejected(title):
    with pytest.raises(ValueError, match="at least 3"):
        validate_task_title(title)


def test_title_with_exactly_three_characters_is_valid():
    assert validate_task_title("API") == "API"


def test_title_with_120_characters_is_valid():
    title = "A" * 120
    assert validate_task_title(title) == title


def test_title_longer_than_120_characters_is_rejected():
    with pytest.raises(ValueError, match="at most 120"):
        validate_task_title("A" * 121)


def test_non_string_title_is_rejected():
    with pytest.raises(ValueError, match="must be a string"):
        validate_task_title(None)