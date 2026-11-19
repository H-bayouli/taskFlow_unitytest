import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from tasks.models import Task, UserProfile


@pytest.fixture
def api_client(db):
    user = get_user_model().objects.create_user(
        username="manager", password="StrongPass2026!"
    )
    UserProfile.objects.create(user=user, role="manager")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_task(db):
    return Task.objects.create(
        title="Write unit tests",
        description="Test the business rules",
        priority=Task.Priority.HIGH,
        status=Task.Status.TODO,
    )


@pytest.mark.django_db
def test_create_task_success(api_client):
    response = api_client.post(
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
    assert response.data["title"] == "Learn pytest" and Task.objects.count() == 1


@pytest.mark.django_db
@pytest.mark.parametrize("title", ["", "ab", "  "])
def test_create_task_with_invalid_title(api_client, title):
    response = api_client.post("/api/tasks/", {"title": title}, format="json")
    assert (
        response.status_code == status.HTTP_400_BAD_REQUEST and "title" in response.data
    )


@pytest.mark.django_db
def test_invalid_priority(api_client):
    response = api_client.post(
        "/api/tasks/", {"title": "Prepare report", "priority": "urgent"}, format="json"
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_list_and_filter_tasks(api_client, sample_task):
    Task.objects.create(title="Read documentation", priority="low")
    response = api_client.get("/api/tasks/?priority=high")
    assert response.status_code == 200 and len(response.data) == 1


@pytest.mark.django_db
def test_invalid_status_filter_returns_400(api_client):
    assert api_client.get("/api/tasks/?status=unknown").status_code == 400


@pytest.mark.django_db
def test_transition_workflow(api_client, sample_task):
    response = api_client.post(
        f"/api/tasks/{sample_task.id}/transition/",
        {"status": "in_progress"},
        format="json",
    )
    assert response.status_code == 200
    response = api_client.post(
        f"/api/tasks/{sample_task.id}/transition/", {"status": "done"}, format="json"
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_delete_task_and_audit(api_client, sample_task):
    response = api_client.delete(f"/api/tasks/{sample_task.id}/")
    assert response.status_code == 204
    from tasks.models import AuditLog

    assert AuditLog.objects.filter(action="delete", entity="task").exists()


@pytest.mark.django_db
def test_authentication_required():
    assert APIClient().get("/api/tasks/").status_code == 401


@pytest.mark.django_db
def test_member_cannot_create_task(db):
    user = get_user_model().objects.create_user(
        username="member", password="StrongPass2026!"
    )
    UserProfile.objects.create(user=user, role="member")
    client = APIClient()
    client.force_authenticate(user=user)
    assert (
        client.post("/api/tasks/", {"title": "Blocked task"}, format="json").status_code
        == 403
    )


@pytest.mark.django_db
def test_project_crud(api_client):
    created = api_client.post(
        "/api/projects/",
        {"name": "Website Redesign", "description": "New company site"},
        format="json",
    )
    assert created.status_code == 201
    project_id = created.data["id"]
    updated = api_client.patch(
        f"/api/projects/{project_id}/", {"description": "Updated scope"}, format="json"
    )
    assert updated.status_code == 200 and updated.data["description"] == "Updated scope"
    assert api_client.delete(f"/api/projects/{project_id}/").status_code == 204


@pytest.mark.django_db
def test_comment_crud(api_client, sample_task):
    created = api_client.post(
        "/api/comments/",
        {"task": sample_task.id, "body": "Initial feedback"},
        format="json",
    )
    assert created.status_code == 201
    comment_id = created.data["id"]
    updated = api_client.patch(
        f"/api/comments/{comment_id}/", {"body": "Revised feedback"}, format="json"
    )
    assert updated.status_code == 200 and updated.data["body"] == "Revised feedback"
    assert api_client.delete(f"/api/comments/{comment_id}/").status_code == 204


@pytest.mark.django_db
def test_admin_user_crud(db):
    admin = get_user_model().objects.create_superuser(
        username="root", password="StrongPass2026!"
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/users/",
        {
            "username": "newmember",
            "email": "newmember@example.test",
            "password": "StrongPass2026!",
            "role_input": "member",
        },
        format="json",
    )
    assert created.status_code == 201
    user_id = created.data["id"]
    updated = client.patch(
        f"/api/users/{user_id}/", {"role_input": "manager"}, format="json"
    )
    assert updated.status_code == 200 and updated.data["role"] == "manager"
    assert client.delete(f"/api/users/{user_id}/").status_code == 204


@pytest.mark.django_db
def test_dashboard_filters(api_client):
    Task.objects.create(title="Dashboard urgent", priority="high", status="todo")
    Task.objects.create(title="Dashboard done", priority="low", status="done")
    response = api_client.get("/api/dashboard/?priority=high")
    assert response.status_code == 200 and response.data["total_tasks"] == 1
