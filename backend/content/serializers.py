from rest_framework import serializers

from .models import Lesson, LessonView, Level, Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name_ar", "name_fr", "slug"]


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ["id", "name_ar", "name_fr", "slug", "order"]


class LessonListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lesson lists (no content blocks)."""

    subject = SubjectSerializer(read_only=True)
    level = LevelSerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "slug",
            "title",
            "language",
            "subject",
            "level",
            "author_username",
            "video_url",
            "translation_group",
            "tags",
            "status",
            "created_at",
            "updated_at",
        ]


class LessonSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    level = LevelSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source="subject", write_only=True
    )
    level_id = serializers.PrimaryKeyRelatedField(
        queryset=Level.objects.all(), source="level", write_only=True
    )
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "slug",
            "title",
            "language",
            "subject",
            "level",
            "subject_id",
            "level_id",
            "author_username",
            "content",
            "video_url",
            "translation_group",
            "tags",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug"]

    def validate_content(self, value):
        if not isinstance(value, dict) or not isinstance(value.get("blocks"), list):
            raise serializers.ValidationError(
                'content must be an object of the form {"blocks": [...]}'
            )
        allowed_types = {"heading", "paragraph", "latex", "image", "video"}
        for i, block in enumerate(value["blocks"]):
            if not isinstance(block, dict) or block.get("type") not in allowed_types:
                raise serializers.ValidationError(
                    f"block {i}: 'type' must be one of {sorted(allowed_types)}"
                )
        return value

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class LessonViewSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)

    class Meta:
        model = LessonView
        fields = ["id", "lesson", "lesson_title", "viewed_at", "completed"]
