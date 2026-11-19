
from django.db import migrations
from django.db.models import F


def migrate_task_users(apps, schema_editor):
    Task = apps.get_model("tasks", "Task")
    db_alias = schema_editor.connection.alias

    # Preserve the old task owner as the assignee.
    Task.objects.using(db_alias).filter(
        user__isnull=False,
        assigned_to__isnull=True,
    ).update(assigned_to_id=F("user_id"))

    # Preserve the old task owner as the creator.
    Task.objects.using(db_alias).filter(
        user__isnull=False,
        created_by__isnull=True,
    ).update(created_by_id=F("user_id"))


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0004_merge_20261119_1744"),
    ]

    operations = [
        migrations.RunPython(
            migrate_task_users,
            migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name="task",
            name="user",
        ),
    ]
