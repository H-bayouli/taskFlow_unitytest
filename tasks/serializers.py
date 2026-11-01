from rest_framework import serializers

from .models import Task
from .services import validate_task_title


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_title(self, value):
        try:
            return validate_task_title(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc