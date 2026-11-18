
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from tasks.models import Task

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPassword123!",
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def sample_task(user):
    return Task.objects.create(
        user=user,
        title="Write unit tests",
        description="Test the business rules",
        priority=Task.Priority.HIGH,
        status=Task.Status.TODO,
    )


@pytest.mark.django_db
def test_create_task_success(authenticated_client):
    response = authenticated_client.post(
        "/api/tasks/",
        {
            "title": "Learn pytest",
            "description": "Practice testing",
            "priority": "high",
            "status": "todo",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Learn pytest"
    assert response.data["priority"] == "high"
    assert Task.objects.count() == 1


@pytest.mark.django_db
@pytest.mark.parametrize("title", ["", "ab", "  "])
def test_create_task_with_invalid_title(authenticated_client, title):
    response = authenticated_client.post(
        "/api/tasks/",
        {"title": title},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "title" in response.data
    assert Task.objects.count() == 0


@pytest.mark.django_db
def test_create_task_with_invalid_priority(authenticated_client):
    response = authenticated_client.post(
        "/api/tasks/",
        {
            "title": "Prepare report",
            "priority": "urgent",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Task.objects.count() == 0


@pytest.mark.django_db
def test_list_tasks(authenticated_client, sample_task):
    response = authenticated_client.get("/api/tasks/")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["title"] == sample_task.title


@pytest.mark.django_db
def test_filter_tasks_by_priority(authenticated_client, sample_task, user):
    Task.objects.create(
        user=user,
        title="Read documentation",
        priority=Task.Priority.LOW,
    )

    response = authenticated_client.get("/api/tasks/?priority=high")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["priority"] == "high"


@pytest.mark.django_db
def test_invalid_status_filter_returns_400(authenticated_client):
    response = authenticated_client.get("/api/tasks/?status=unknown")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_update_task(authenticated_client, sample_task):
    response = authenticated_client.patch(
        f"/api/tasks/{sample_task.id}/",
        {"status": "done"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    sample_task.refresh_from_db()
    assert sample_task.status == Task.Status.DONE


@pytest.mark.django_db
def test_delete_task(authenticated_client, sample_task):
    response = authenticated_client.delete(
        f"/api/tasks/{sample_task.id}/"
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Task.objects.filter(id=sample_task.id).exists()


@pytest.mark.django_db
def test_missing_task_returns_404(authenticated_client):
    response = authenticated_client.get("/api/tasks/999999/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_unauthenticated_user_cannot_access_tasks(api_client):
    response = api_client.get("/api/tasks/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
