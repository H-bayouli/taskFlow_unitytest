def validate_task_title(title: str) -> str:
    """Normalize a title and reject invalid values."""
    if not isinstance(title, str):
        raise ValueError("Title must be a string.")

    normalized = title.strip()

    if len(normalized) < 3:
        raise ValueError("Title must contain at least 3 characters.")

    if len(normalized) > 120:
        raise ValueError("Title must contain at most 120 characters.")

    return normalized


def calculate_priority_score(priority: str) -> int:
    """Convert task priority into a numeric score."""
    scores = {
        "low": 1,
        "medium": 2,
        "high": 3,
    }

    try:
        return scores[priority]
    except (KeyError, TypeError):
        raise ValueError("Invalid priority.") from None