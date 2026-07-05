from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsAdminOrReadOnly
from quizzes.models import Attempt, Quiz

from .import_export import export_lesson, export_quiz, import_lessons, import_quizzes
from .models import Lesson, LessonView, Level, Subject
from .serializers import (
    LessonListSerializer,
    LessonSerializer,
    LevelSerializer,
    SubjectSerializer,
)

User = get_user_model()


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None


class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None


class LessonViewSet(viewsets.ModelViewSet):
    """Students/public read published lessons (with subject/level/language
    filters); admins get full CRUD including drafts."""

    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == "list":
            return LessonListSerializer
        return LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related("subject", "level", "author")
        user = self.request.user
        if not (user.is_authenticated and user.role == "admin"):
            qs = qs.filter(status="published")
        params = self.request.query_params
        if params.get("subject"):
            qs = qs.filter(subject__slug=params["subject"])
        if params.get("level"):
            qs = qs.filter(level__slug=params["level"])
        if params.get("language"):
            qs = qs.filter(language=params["language"])
        if params.get("status") and user.is_authenticated and user.role == "admin":
            qs = qs.filter(status=params["status"])
        if params.get("search"):
            qs = qs.filter(title__icontains=params["search"])
        return qs

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """Mark this lesson viewed/completed by the current student."""
        lesson = self.get_object()
        view, _ = LessonView.objects.get_or_create(student=request.user, lesson=lesson)
        view.completed = bool(request.data.get("completed", True))
        view.save()
        return Response({"lesson": lesson.id, "completed": view.completed})


class LessonImportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        created, errors = import_lessons(request.data, request.user)
        code = status.HTTP_201_CREATED if created and not errors else (
            status.HTTP_207_MULTI_STATUS if created else status.HTTP_400_BAD_REQUEST
        )
        return Response({"created": created, "errors": errors}, status=code)


class QuizImportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        created, errors = import_quizzes(request.data, request.user)
        code = status.HTTP_201_CREATED if created and not errors else (
            status.HTTP_207_MULTI_STATUS if created else status.HTTP_400_BAD_REQUEST
        )
        return Response({"created": created, "errors": errors}, status=code)


class ExportView(APIView):
    """POST {lesson_ids: [], quiz_ids: []} → re-importable JSON."""

    permission_classes = [IsAdmin]

    def post(self, request):
        lesson_ids = request.data.get("lesson_ids", [])
        quiz_ids = request.data.get("quiz_ids", [])
        lessons = Lesson.objects.filter(id__in=lesson_ids).select_related(
            "subject", "level"
        )
        quizzes = Quiz.objects.filter(id__in=quiz_ids).select_related(
            "level", "lesson"
        ).prefetch_related("questions__choices")
        return Response(
            {
                "lessons": [export_lesson(lesson) for lesson in lessons],
                "quizzes": [export_quiz(quiz) for quiz in quizzes],
            }
        )


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        recent_attempts = Attempt.objects.select_related("student", "quiz")[:10]
        return Response(
            {
                "students_count": User.objects.filter(role="student").count(),
                "lessons_count": Lesson.objects.count(),
                "published_lessons_count": Lesson.objects.filter(
                    status="published"
                ).count(),
                "quizzes_count": Quiz.objects.count(),
                "attempts_count": Attempt.objects.count(),
                "recent_attempts": [
                    {
                        "student": attempt.student.username,
                        "quiz": attempt.quiz.title,
                        "score": attempt.score,
                        "total_questions": attempt.total_questions,
                        "completed_at": attempt.completed_at,
                    }
                    for attempt in recent_attempts
                ],
            }
        )
