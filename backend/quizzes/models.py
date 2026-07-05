from django.conf import settings
from django.db import models

from content.models import Lesson, Level


class Quiz(models.Model):
    QUIZ_TYPE_CHOICES = [("lesson", "Lesson Quiz"), ("entrance_exam", "Entrance Exam")]
    LANGUAGE_CHOICES = [("ar", "Arabic"), ("fr", "French")]
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published")]

    title = models.CharField(max_length=255)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes"
    )
    lesson = models.ForeignKey(
        Lesson, null=True, blank=True, on_delete=models.SET_NULL, related_name="quizzes"
    )
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name="quizzes")
    quiz_type = models.CharField(
        max_length=20, choices=QUIZ_TYPE_CHOICES, default="lesson"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "quizzes"

    def __str__(self):
        return f"{self.title} [{self.language}]"


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    # Supports LaTeX via $...$ / $$...$$
    text = models.TextField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name="choices", on_delete=models.CASCADE)
    text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text[:50]


class Attempt(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score = models.FloatField()
    total_questions = models.IntegerField()
    # {question_id: choice_id, ...}
    answers = models.JSONField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title}: {self.score}/{self.total_questions}"
