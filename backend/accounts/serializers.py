from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "avatar_url",
            "preferred_ui_language",
            "created_at",
        ]
        read_only_fields = ["id", "role", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "preferred_ui_language",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Public registration always creates students; other roles are
        # created by the admin (future: dedicated flows for teachers/parents).
        user = User(role="student", **validated_data)
        user.set_password(password)
        user.save()
        return user
