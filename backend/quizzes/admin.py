from django.contrib import admin

from .models import Attempt, Choice, Question, Quiz


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "language", "level", "quiz_type", "status", "created_at"]
    list_filter = ["language", "quiz_type", "status", "level"]
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["quiz", "order", "text"]
    inlines = [ChoiceInline]


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ["student", "quiz", "score", "total_questions", "completed_at"]
    list_filter = ["quiz"]
