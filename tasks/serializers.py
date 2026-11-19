from rest_framework import serializers

from .models import AuditLog, Comment, Project, Task, UserProfile
from .services import validate_task_title


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    assigned_username = serializers.CharField(
        source="assigned_to.username", read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "assigned_to",
            "assigned_username",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        try:
            return validate_task_title(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate(self, attrs):
        due = attrs.get("due_date")

        if due and self.instance and self.instance.created_at.date() > due:
            raise serializers.ValidationError(
                {"due_date": "Due date cannot be before task creation."}
            )

        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "owner",
            "owner_name",
            "members",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Project name must contain at least 3 characters."
            )

        return value


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "task",
            "task_title",
            "author",
            "author_name",
            "body",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
        ]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment cannot be empty.")

        return value.strip()


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
        ]


class UserManagementSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    role_input = serializers.ChoiceField(
        choices=UserProfile.Role.choices, write_only=True, required=False
    )

    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        from django.contrib.auth import get_user_model

        model = get_user_model()

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "role_input",
            "is_active",
        ]

        read_only_fields = ["id"]

    def get_role(self, obj):
        return getattr(getattr(obj, "profile", None), "role", "member")

    def create(self, validated_data):
        from django.contrib.auth import get_user_model

        User = get_user_model()

        role = validated_data.pop("role_input", "member")
        password = validated_data.pop("password", None)

        if not password:
            raise serializers.ValidationError(
                {
                    "password": "Password is required."  # nosec B105
                }
            )

        user = User.objects.create_user(password=password, **validated_data)

        UserProfile.objects.update_or_create(user=user, defaults={"role": role})

        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role_input", None)
        password = validated_data.pop("password", None)

        for key, value in validated_data.items():
            setattr(instance, key, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role is not None:
            profile, created = UserProfile.objects.update_or_create(
                user=instance, defaults={"role": role}
            )

            # Refresh the cached related profile
            instance.profile = profile

        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(
        source="actor.username", read_only=True, allow_null=True
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_name",
            "action",
            "entity",
            "entity_id",
            "details",
            "ip_address",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "actor",
            "action",
            "entity",
            "entity_id",
            "details",
            "ip_address",
            "created_at",
        ]
