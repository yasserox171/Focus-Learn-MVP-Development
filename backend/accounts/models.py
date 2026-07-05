from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Unified user model for all roles.

    The MVP only exposes student registration and the single admin account,
    but the schema supports teachers and parents from day one so no future
    restructuring is needed.
    """

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("teacher", "Teacher"),
        ("student", "Student"),
        ("parent", "Parent"),
    ]
    UI_LANGUAGE_CHOICES = [("ar", "Arabic"), ("fr", "French")]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    preferred_ui_language = models.CharField(
        max_length=2, choices=UI_LANGUAGE_CHOICES, default="ar"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ParentStudentLink(models.Model):
    """Parent/student relationship. Schema-ready for the future parent role;
    not exposed in the MVP UI."""

    parent = models.ForeignKey(User, related_name="children", on_delete=models.CASCADE)
    student = models.ForeignKey(User, related_name="parents", on_delete=models.CASCADE)
    confirmation_code = models.CharField(max_length=10)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("parent", "student")]

    def __str__(self):
        return f"{self.parent.username} -> {self.student.username}"
