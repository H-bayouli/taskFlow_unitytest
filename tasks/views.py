from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import AuditLog, Comment, Project, Task, UserProfile
from .permissions import IsAdmin, IsManagerOrAdmin, role_of
from .serializers import (
    AuditLogSerializer,
    CommentSerializer,
    ProjectSerializer,
    TaskSerializer,
    UserManagementSerializer,
)
from .services import validate_transition

User = get_user_model()


def audit(request, action_name, entity, obj=None, details=None):
    AuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=action_name,
        entity=entity,
        entity_id=str(getattr(obj, "pk", "")),
        details=details or {},
        ip_address=request.META.get("REMOTE_ADDR"),
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role_of(user),
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": role_of(request.user),
        }
    )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    queryset = (
        Task.objects.select_related("project", "assigned_to", "created_by")
        .all()
        .order_by("-created_at")
    )

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if role_of(self.request.user) == "member":
            qs = qs.filter(
                Q(assigned_to=self.request.user)
                | Q(created_by=self.request.user)
                | Q(project__members=self.request.user)
            )
        for key, field, valid in [
            ("status", "status", Task.Status.values),
            ("priority", "priority", Task.Priority.values),
        ]:
            value = p.get(key)
            if value:
                if value not in valid:
                    raise ValidationError({key: "Invalid filter value."})
                qs = qs.filter(**{field: value})
        if p.get("project"):
            qs = qs.filter(project_id=p["project"])
        if p.get("search"):
            qs = qs.filter(
                Q(title__icontains=p["search"]) | Q(description__icontains=p["search"])
            )
        return qs.distinct()

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        audit(self.request, "create", "task", obj, {"title": obj.title})

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        if (
            "status" in serializer.validated_data
            and serializer.validated_data["status"] != old_status
        ):
            try:
                validate_transition(old, serializer.validated_data["status"])
            except ValueError as exc:
                raise ValidationError({"status": str(exc)}) from exc
        obj = serializer.save()
        audit(
            self.request,
            "update",
            "task",
            obj,
            {"old_status": old_status, "new_status": obj.status},
        )

    def perform_destroy(self, instance):
        audit(self.request, "delete", "task", instance)
        instance.delete()

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get("status")
        try:
            validate_transition(task, new_status)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        previous = task.status
        task.status = new_status
        task.save(update_fields=["status", "updated_at"])
        audit(request, "transition", "task", task, {"from": previous, "to": new_status})
        return Response(self.get_serializer(task).data)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    queryset = (
        Project.objects.annotate(task_count=Count("tasks"))
        .prefetch_related("members")
        .order_by("-created_at")
    )

    def get_queryset(self):
        qs = super().get_queryset()
        if role_of(self.request.user) == "member":
            qs = qs.filter(Q(owner=self.request.user) | Q(members=self.request.user))
        return qs.distinct()

    def perform_create(self, serializer):
        obj = serializer.save(owner=self.request.user)
        obj.members.add(self.request.user)
        audit(self.request, "create", "project", obj)

    def perform_update(self, serializer):
        obj = serializer.save()
        audit(self.request, "update", "project", obj)

    def perform_destroy(self, instance):
        audit(self.request, "delete", "project", instance)
        instance.delete()


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.select_related("author", "task").all()

    def get_queryset(self):
        qs = super().get_queryset()
        if role_of(self.request.user) == "member":
            qs = qs.filter(
                Q(task__assigned_to=self.request.user)
                | Q(task__created_by=self.request.user)
                | Q(task__project__members=self.request.user)
            )
        return qs.distinct()

    def perform_create(self, serializer):
        task = serializer.validated_data["task"]
        if role_of(self.request.user) == "member" and not (
            task.assigned_to_id == self.request.user.id
            or task.created_by_id == self.request.user.id
            or task.project_id
            and task.project.members.filter(id=self.request.user.id).exists()
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        obj = serializer.save(author=self.request.user)
        audit(self.request, "create", "comment", obj)

    def perform_update(self, serializer):
        if self.get_object().author_id != self.request.user.id and role_of(
            self.request.user
        ) not in ("admin", "manager"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        obj = serializer.save()
        audit(self.request, "update", "comment", obj)

    def perform_destroy(self, instance):
        if instance.author_id != self.request.user.id and role_of(
            self.request.user
        ) not in ("admin", "manager"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        audit(self.request, "delete", "comment", instance)
        instance.delete()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    tasks = Task.objects.all()
    if role_of(request.user) == "member":
        tasks = tasks.filter(
            Q(assigned_to=request.user)
            | Q(created_by=request.user)
            | Q(project__members=request.user)
        ).distinct()
    params = request.query_params
    if params.get("status"):
        if params["status"] not in Task.Status.values:
            raise ValidationError({"status": "Invalid filter value."})
        tasks = tasks.filter(status=params["status"])
    if params.get("priority"):
        if params["priority"] not in Task.Priority.values:
            raise ValidationError({"priority": "Invalid filter value."})
        tasks = tasks.filter(priority=params["priority"])
    if params.get("project"):
        if not params["project"].isdigit():
            raise ValidationError({"project": "Invalid project id."})
        tasks = tasks.filter(project_id=int(params["project"]))
    visible_projects = (
        Project.objects.all()
        if role_of(request.user) in ("admin", "manager")
        else Project.objects.filter(Q(owner=request.user) | Q(members=request.user))
    )
    if params.get("project"):
        visible_projects = visible_projects.filter(id=params["project"])
    return Response(
        {
            "total_tasks": tasks.count(),
            "todo": tasks.filter(status="todo").count(),
            "in_progress": tasks.filter(status="in_progress").count(),
            "review": tasks.filter(status="review").count(),
            "done": tasks.filter(status="done").count(),
            "high_priority": tasks.filter(priority="high").count(),
            "overdue": tasks.filter(due_date__lt=timezone.localdate())
            .exclude(status="done")
            .count(),
            "projects": visible_projects.distinct().count(),
        }
    )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("profile").all().order_by("username")

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [IsAuthenticated(), IsManagerOrAdmin()]
        return [IsAuthenticated(), IsAdmin()]

    def get_serializer_class(self):
        return (
            UserManagementSerializer
            if self.action in ("create", "update", "partial_update", "destroy")
            else UserManagementSerializer
        )

    def perform_create(self, serializer):
        obj = serializer.save()
        audit(self.request, "create", "user", obj, {"username": obj.username})

    def perform_update(self, serializer):
        obj = serializer.save()
        audit(self.request, "update", "user", obj, {"username": obj.username})

    def perform_destroy(self, instance):
        audit(self.request, "delete", "user", instance, {"username": instance.username})
        instance.delete()


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = AuditLog.objects.select_related("actor").all()
