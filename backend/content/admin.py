from django.contrib import admin

from .models import Lesson, LessonView, Level, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["slug", "name_ar", "name_fr"]
    prepopulated_fields = {"slug": ("name_fr",)}


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ["slug", "name_ar", "name_fr", "order"]
    prepopulated_fields = {"slug": ("name_fr",)}


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["title", "language", "subject", "level", "status", "created_at"]
    list_filter = ["language", "status", "subject", "level"]
    search_fields = ["title"]


@admin.register(LessonView)
class LessonViewAdmin(admin.ModelAdmin):
    list_display = ["student", "lesson", "completed", "viewed_at"]
