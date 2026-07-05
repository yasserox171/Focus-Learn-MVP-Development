from django.conf import settings
from django.db import models


class Subject(models.Model):
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.slug


class Level(models.Model):
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.slug


class Lesson(models.Model):
    LANGUAGE_CHOICES = [("ar", "Arabic"), ("fr", "French")]
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published")]

    title = models.CharField(max_length=255)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lessons"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="lessons")
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name="lessons")
    # Structured content: { "blocks": [ {"type": "heading"|"paragraph"|"latex"|"image"|"video", ...} ] }
    content = models.JSONField(default=dict)
    video_url = models.URLField(blank=True, null=True)
    # Links language versions of the same lesson together
    translation_group = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} [{self.language}]"


class LessonView(models.Model):
    """Simple per-student progress tracking."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="viewed_lessons"
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="views")
    viewed_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = [("student", "lesson")]

    def __str__(self):
        return f"{self.student.username} viewed {self.lesson.title}"
