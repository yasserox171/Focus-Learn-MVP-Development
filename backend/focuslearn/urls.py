"""Focus Learn URL configuration."""

from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import LoginView, MeView, RegisterView
from content.views import (
    AdminDashboardView,
    ExportView,
    LessonImportView,
    LessonViewSet,
    LevelViewSet,
    QuizImportView,
    SubjectViewSet,
)
from quizzes.views import MyAttemptsView, MyProgressView, QuizViewSet

router = DefaultRouter()
router.register(r"subjects", SubjectViewSet, basename="subject")
router.register(r"levels", LevelViewSet, basename="level")
router.register(r"lessons", LessonViewSet, basename="lesson")
router.register(r"quizzes", QuizViewSet, basename="quiz")

urlpatterns = [
    path("django-admin/", admin.site.urls),
    # Auth
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Current user
    path("api/me/", MeView.as_view(), name="me"),
    path("api/me/attempts/", MyAttemptsView.as_view(), name="my-attempts"),
    path("api/me/progress/", MyProgressView.as_view(), name="my-progress"),
    # Admin-only tools
    path("api/admin/lessons/import/", LessonImportView.as_view(), name="lessons-import"),
    path("api/admin/quizzes/import/", QuizImportView.as_view(), name="quizzes-import"),
    path("api/admin/export/", ExportView.as_view(), name="export"),
    path("api/admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    # Resource routes (read for everyone, write for admin)
    path("api/", include(router.urls)),
]
