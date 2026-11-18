
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from tasks.models import Task

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPassword123!"
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
