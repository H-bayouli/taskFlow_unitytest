
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from tasks.models import Task, UserProfile


@pytest.mark.django_db
def test_login_invalid_credentials():
    client = APIClient()
    response = client.post(
        "/api/auth/login/",
        {"username": "unknown", "password": "wrong"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_login_success():
    User = get_user_model()
    user = User.objects.create_user(
        username="login_test",
        password="StrongPass2026!",
    )
    UserProfile.objects.create(user=user, role="member")

    client = APIClient()
    response = client.post(
        "/api/auth/login/",
        {"username": "login_test", "password": "StrongPass2026!"},
        format="json",
    )

    assert response.status_code == 200
    assert "token" in response.data
    assert response.data["user"]["role"] == "member"


@pytest.mark.django_db
def test_me_endpoint():
    User = get_user_model()
    user = User.objects.create_user(username="me_test")
    UserProfile.objects.create(user=user, role="member")

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["username"] == "me_test"
    assert response.data["role"] == "member"


@pytest.mark.django_db
def test_logout_endpoint():
    User = get_user_model()
    user = User.objects.create_user(username="logout_test")
    token = Token.objects.create(user=user)

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/auth/logout/")

    assert response.status_code == 204
    assert not Token.objects.filter(pk=token.pk).exists()


@pytest.mark.django_db
def test_dashboard_invalid_status():
    User = get_user_model()
    user = User.objects.create_user(username="dashboard_test")
    UserProfile.objects.create(user=user, role="manager")

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/dashboard/?status=unknown")

    assert response.status_code == 400


@pytest.mark.django_db
def test_dashboard_invalid_priority():
    User = get_user_model()
    user = User.objects.create_user(username="priority_test")
    UserProfile.objects.create(user=user, role="manager")

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/dashboard/?priority=unknown")

    assert response.status_code == 400


@pytest.mark.django_db
def test_dashboard_invalid_project_id():
    User = get_user_model()
    user = User.objects.create_user(username="project_test")
    UserProfile.objects.create(user=user, role="manager")

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/dashboard/?project=abc")

    assert response.status_code == 400
