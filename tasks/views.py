
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

        params = self.request.query_params

        status_value = params.get("status")
        priority_value = params.get("priority")

        valid_statuses = Task.Status.values
        valid_priorities = Task.Priority.values

        if status_value:
            if status_value not in valid_statuses:
                raise ValidationError({
                    "status": "Invalid status filter."
                })

            queryset = queryset.filter(status=status_value)

        if priority_value:
            if priority_value not in valid_priorities:
                raise ValidationError({
                    "priority": "Invalid priority filter."
                })

            queryset = queryset.filter(priority=priority_value)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
