from rest_framework import serializers

from content.models import Lesson, Level
from content.serializers import LevelSerializer

from .models import Attempt, Choice, Question, Quiz


class ChoiceStudentSerializer(serializers.ModelSerializer):
    """Choices as seen by students — never exposes is_correct."""

    class Meta:
        model = Choice
        fields = ["id", "text"]


class ChoiceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct"]


class QuestionStudentSerializer(serializers.ModelSerializer):
    choices = ChoiceStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "order", "choices"]


class QuestionAdminSerializer(serializers.ModelSerializer):
    choices = ChoiceAdminSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "text", "order", "choices"]


class QuizListSerializer(serializers.ModelSerializer):
    level = LevelSerializer(read_only=True)
    lesson_title = serializers.CharField(source="lesson.title", read_only=True, default=None)
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "slug",
            "title",
            "language",
            "lesson",
            "lesson_title",
            "level",
            "quiz_type",
            "status",
            "questions_count",
            "created_at",
        ]


class QuizStudentSerializer(QuizListSerializer):
    questions = QuestionStudentSerializer(many=True, read_only=True)

    class Meta(QuizListSerializer.Meta):
        fields = QuizListSerializer.Meta.fields + ["questions"]


class QuizAdminSerializer(serializers.ModelSerializer):
    """Full quiz read/write for admins, with nested questions/choices."""

    questions = QuestionAdminSerializer(many=True)
    level = LevelSerializer(read_only=True)
    level_id = serializers.PrimaryKeyRelatedField(
        queryset=Level.objects.all(), source="level", write_only=True
    )
    lesson = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(), required=False, allow_null=True
    )
    lesson_title = serializers.CharField(source="lesson.title", read_only=True, default=None)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "slug",
            "title",
            "language",
            "lesson",
            "lesson_title",
            "level",
            "level_id",
            "quiz_type",
            "status",
            "questions",
            "created_at",
        ]
        read_only_fields = ["slug"]

    def validate_questions(self, value):
        for i, question in enumerate(value):
            choices = question.get("choices", [])
            if len(choices) < 2:
                raise serializers.ValidationError(
                    f"question {i}: must have at least 2 choices"
                )
            if not any(choice.get("is_correct") for choice in choices):
                raise serializers.ValidationError(
                    f"question {i}: no choice marked is_correct"
                )
        return value

    def _write_questions(self, quiz, questions_data):
        quiz.questions.all().delete()
        for q_index, question_data in enumerate(questions_data):
            choices_data = question_data.pop("choices")
            question_data.pop("id", None)
            question = Question.objects.create(
                quiz=quiz,
                text=question_data["text"],
                order=question_data.get("order", q_index + 1),
            )
            Choice.objects.bulk_create(
                Choice(
                    question=question,
                    text=choice_data["text"],
                    is_correct=choice_data.get("is_correct", False),
                )
                for choice_data in choices_data
            )

    def create(self, validated_data):
        questions_data = validated_data.pop("questions")
        validated_data["author"] = self.context["request"].user
        quiz = Quiz.objects.create(**validated_data)
        self._write_questions(quiz, questions_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions_data is not None:
            self._write_questions(instance, questions_data)
        return instance


class AttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)

    class Meta:
        model = Attempt
        fields = [
            "id",
            "quiz",
            "quiz_title",
            "score",
            "total_questions",
            "answers",
            "completed_at",
        ]
