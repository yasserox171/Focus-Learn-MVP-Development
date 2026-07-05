from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ParentStudentLink, User


@admin.register(User)
class FocusLearnUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Focus Learn", {"fields": ("role", "phone", "avatar_url", "preferred_ui_language")}),
    )
    list_display = ["username", "email", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]


@admin.register(ParentStudentLink)
class ParentStudentLinkAdmin(admin.ModelAdmin):
    list_display = ["parent", "student", "confirmed", "created_at"]
