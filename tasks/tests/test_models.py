import pytest

from tasks.models import Task


@pytest.mark.django_db
def test_task_defaults():
    task = Task.objects.create(title="Review pull request")

    assert task.priority == Task.Priority.MEDIUM
    assert task.status == Task.Status.TODO
    assert task.description == ""
    assert task.created_at is not None


@pytest.mark.django_db
def test_task_string_representation():
    task = Task.objects.create(title="Improve test coverage")

    assert str(task) == "Improve test coverage"