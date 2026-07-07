"""Focus Learn URL configuration."""

from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import LoginView, MeView, RegisterView
from content import seo_views
from content.sitemaps import SITEMAPS
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
    # --- SEO: server-rendered public pages + sitemap/robots ---
    path("sitemap.xml", sitemap, {"sitemaps": SITEMAPS}, name="sitemap"),
    path("robots.txt", seo_views.robots_txt, name="robots"),
    path("lesson/<slug:slug>/", seo_views.lesson_page, name="seo-lesson"),
    path("quiz/<slug:slug>/", seo_views.quiz_page, name="seo-quiz"),
    path(
        "lessons/<slug:subject_slug>/<slug:level_slug>/",
        seo_views.category_page,
        name="seo-category",
    ),
    path("", seo_views.seo_index, name="seo-index"),
]
