from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuditLogViewSet,
    CommentViewSet,
    ProjectViewSet,
    TaskViewSet,
    UserViewSet,
    dashboard,
    login_view,
    logout_view,
    me_view,
)

router = DefaultRouter()
router.register("tasks", TaskViewSet)
router.register("projects", ProjectViewSet)
router.register("comments", CommentViewSet)
router.register("users", UserViewSet)
router.register("audit", AuditLogViewSet)
urlpatterns = [
    path("auth/login/", login_view),
    path("auth/logout/", logout_view),
    path("auth/me/", me_view),
    path("dashboard/", dashboard),
    path("", include(router.urls)),
]
