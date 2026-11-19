def validate_task_title(title: str) -> str:
    if not isinstance(title, str):
        raise ValueError("Title must be a string.")
    normalized = title.strip()
    if len(normalized) < 3:
        raise ValueError("Title must contain at least 3 characters.")
    if len(normalized) > 120:
        raise ValueError("Title must contain at most 120 characters.")
    return normalized


def calculate_priority_score(priority: str) -> int:
    scores = {"low": 1, "medium": 2, "high": 3}
    try:
        return scores[priority]
    except (KeyError, TypeError):
        raise ValueError("Invalid priority.") from None


def validate_transition(task, new_status):
    if new_status not in task.Status.values:
        raise ValueError("Invalid status.")
    if not task.can_transition(new_status):
        raise ValueError(f"Transition {task.status} -> {new_status} is not allowed.")
    return new_status
