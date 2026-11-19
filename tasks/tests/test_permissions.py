
import pytest
from types import SimpleNamespace
from rest_framework.test import APIRequestFactory

from tasks.permissions import (
    role_of,
    IsAuthenticatedReadOnlyOrManager,
    IsAdmin,
    IsManagerOrAdmin,
)


@pytest.mark.django_db
def test_role_of_unauthenticated_user():
    user = SimpleNamespace(is_authenticated=False)
    assert role_of(user) is None


@pytest.mark.django_db
def test_role_of_superuser():
    user = SimpleNamespace(
        is_authenticated=True,
        is_superuser=True,
    )
    assert role_of(user) == "admin"


@pytest.mark.django_db
def test_role_of_user_without_profile():
    user = SimpleNamespace(
        is_authenticated=True,
        is_superuser=False,
        profile=None,
    )
    assert role_of(user) == "member"


@pytest.mark.django_db
def test_role_of_manager():
    profile = SimpleNamespace(role="manager")
    user = SimpleNamespace(
        is_authenticated=True,
        is_superuser=False,
        profile=profile,
    )
    assert role_of(user) == "manager"


def test_read_only_permission_for_member():
    permission = IsAuthenticatedReadOnlyOrManager()
    factory = APIRequestFactory()
    user = SimpleNamespace(is_authenticated=True, is_superuser=False)
    user.profile = SimpleNamespace(role="member")

    request = factory.get("/api/tasks/")
    request.user = user
    assert permission.has_permission(request, None)

    request = factory.post("/api/tasks/")
    request.user = user
    assert not permission.has_permission(request, None)


def test_manager_permission():
    permission = IsManagerOrAdmin()
    factory = APIRequestFactory()
    request = factory.post("/api/tasks/")

    request.user = SimpleNamespace(
        is_authenticated=True,
        is_superuser=False,
        profile=SimpleNamespace(role="manager"),
    )
    assert permission.has_permission(request, None)


def test_admin_permission_rejects_manager():
    permission = IsAdmin()
    factory = APIRequestFactory()
    request = factory.get("/api/audit/")

    request.user = SimpleNamespace(
        is_authenticated=True,
        is_superuser=False,
        profile=SimpleNamespace(role="manager"),
    )
    assert not permission.has_permission(request, None)
