
from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from tasks.models import Project, Task, UserProfile


@pytest.mark.django_db
def test_seed_demo_creates_demo_data():
    output = StringIO()

    call_command("seed_demo", stdout=output)

    User = get_user_model()

    assert User.objects.filter(
        username__in=["admin", "manager", "member"]
    ).count() == 3

    assert UserProfile.objects.count() == 3

    project = Project.objects.get(
        name="Projet de démonstration"
    )
    assert project.owner.username == "manager"
    assert project.members.filter(
        username="manager"
    ).exists()
    assert project.members.filter(
        username="member"
    ).exists()

    task = Task.objects.get(
        title="Préparer la démonstration"
    )
    assert task.project == project
    assert task.assigned_to.username == "member"
    assert task.created_by.username == "manager"
    assert task.priority == "high"

    assert "Données de démonstration créées" in output.getvalue()


@pytest.mark.django_db
def test_seed_demo_is_idempotent():
    call_command("seed_demo", stdout=StringIO())
    call_command("seed_demo", stdout=StringIO())

    User = get_user_model()

    assert User.objects.filter(
        username__in=["admin", "manager", "member"]
    ).count() == 3

    assert Project.objects.filter(
        name="Projet de démonstration"
    ).count() == 1

    assert Task.objects.filter(
        title="Préparer la démonstration"
    ).count() == 1
