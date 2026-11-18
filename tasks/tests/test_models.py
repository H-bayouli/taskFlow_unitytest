import pytest
from django.contrib.auth import get_user_model

from tasks.models import Task

User = get_user_model()


@pytest.mark.django_db
def test_task_defaults():
    user = User.objects.create_user(
        username="modeluser",
        password="TestPassword123!",
    )

    task = Task.objects.create(
        user=user,
        title="Review pull request",
    )

    assert task.priority == Task.Priority.MEDIUM
    assert task.status == Task.Status.TODO
    assert task.description == ""
    assert task.created_at is not None


@pytest.mark.django_db
def test_task_string_representation():
    user = User.objects.create_user(
        username="stringuser",
        password="TestPassword123!",
    )

    task = Task.objects.create(
        user=user,
        title="Improve test coverage",
    )

    assert str(task) == "Improve test coverage"
