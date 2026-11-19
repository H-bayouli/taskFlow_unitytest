from rest_framework.permissions import SAFE_METHODS, BasePermission


def role_of(user):
    if not user.is_authenticated:
        return None
    if user.is_superuser:
        return "admin"
    profile = getattr(user, "profile", None)
    return getattr(profile, "role", "member")


class IsAuthenticatedReadOnlyOrManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.method in SAFE_METHODS or role_of(request.user) in (
            "admin",
            "manager",
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_of(request.user) == "admin"


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_of(request.user) in (
            "admin",
            "manager",
        )
