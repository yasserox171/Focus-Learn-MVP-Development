from django.db.models import Avg, F, FloatField, ExpressionWrapper
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminOrReadOnly
from content.models import LessonView

from .models import Attempt, Quiz
from .serializers import (
    AttemptSerializer,
    QuizAdminSerializer,
    QuizListSerializer,
    QuizStudentSerializer,
)


class QuizViewSet(viewsets.ModelViewSet):
    """Students/public read published quizzes without correct answers;
    admins get full CRUD with nested questions/choices."""

    permission_classes = [IsAdminOrReadOnly]

    def _is_admin(self):
        user = self.request.user
        return user.is_authenticated and user.role == "admin"

    def get_serializer_class(self):
        if self.action == "list":
            return QuizListSerializer
        if self._is_admin():
            return QuizAdminSerializer
        return QuizStudentSerializer

    def get_queryset(self):
        qs = Quiz.objects.select_related("level", "lesson").prefetch_related(
            "questions__choices"
        )
        if not self._is_admin():
            qs = qs.filter(status="published")
        params = self.request.query_params
        if params.get("lesson"):
            qs = qs.filter(lesson_id=params["lesson"])
        if params.get("level"):
            qs = qs.filter(level__slug=params["level"])
        if params.get("language"):
            qs = qs.filter(language=params["language"])
        if params.get("quiz_type"):
            qs = qs.filter(quiz_type=params["quiz_type"])
        return qs

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        """Grade the submitted answers, create an Attempt, and return the
        score together with the per-question correction."""
        quiz = self.get_object()
        raw_answers = request.data.get("answers")
        if not isinstance(raw_answers, dict):
            return Response(
                {"detail": 'expected {"answers": {"<question_id>": <choice_id>}}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            answers = {int(k): int(v) for k, v in raw_answers.items()}
        except (TypeError, ValueError):
            return Response(
                {"detail": "answers keys and values must be integer ids"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions = quiz.questions.prefetch_related("choices")
        score = 0
        correction = []
        for question in questions:
            correct_choice = next(
                (c for c in question.choices.all() if c.is_correct), None
            )
            chosen_id = answers.get(question.id)
            valid_ids = {c.id for c in question.choices.all()}
            if chosen_id is not None and chosen_id not in valid_ids:
                chosen_id = None
            is_correct = correct_choice is not None and chosen_id == correct_choice.id
            if is_correct:
                score += 1
            correction.append(
                {
                    "question_id": question.id,
                    "chosen_choice_id": chosen_id,
                    "correct_choice_id": correct_choice.id if correct_choice else None,
                    "is_correct": is_correct,
                }
            )

        attempt = Attempt.objects.create(
            student=request.user,
            quiz=quiz,
            score=score,
            total_questions=questions.count(),
            answers={str(k): v for k, v in answers.items()},
        )

        # Submitting a lesson quiz marks the linked lesson as completed
        if quiz.lesson_id:
            LessonView.objects.update_or_create(
                student=request.user,
                lesson_id=quiz.lesson_id,
                defaults={"completed": True},
            )

        return Response(
            {
                "attempt_id": attempt.id,
                "score": score,
                "total_questions": attempt.total_questions,
                "correction": correction,
            },
            status=status.HTTP_201_CREATED,
        )


class MyAttemptsView(generics.ListAPIView):
    serializer_class = AttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Attempt.objects.filter(student=self.request.user).select_related("quiz")


class MyProgressView(APIView):
    """Simple progress summary: completed lessons, average score, last activity."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = Attempt.objects.filter(student=request.user)
        avg = attempts.aggregate(
            avg_pct=Avg(
                ExpressionWrapper(
                    100.0 * F("score") / F("total_questions"),
                    output_field=FloatField(),
                )
            )
        )
        last_attempt = attempts.first()
        return Response(
            {
                "completed_lessons": LessonView.objects.filter(
                    student=request.user, completed=True
                ).count(),
                "viewed_lessons": LessonView.objects.filter(
                    student=request.user
                ).count(),
                "attempts_count": attempts.count(),
                "average_score_pct": round(avg["avg_pct"], 1) if avg["avg_pct"] is not None else None,
                "last_activity": last_attempt.completed_at if last_attempt else None,
            }
        )
