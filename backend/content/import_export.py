"""Lesson/quiz JSON import & export.

Import accepts either a single object or a list (batch import). Each item is
validated — subject/level slugs must exist, quizzes must resolve their linked
lesson — and per-item errors are reported with the missing element named, so
one bad item doesn't silently drop the rest.
"""

from django.db import transaction

from quizzes.models import Choice, Question, Quiz

from .models import Lesson, Level, Subject

LESSON_REQUIRED_FIELDS = ["title", "language", "subject", "level", "content"]
QUIZ_REQUIRED_FIELDS = ["title", "language", "level", "questions"]


def _as_list(payload):
    return payload if isinstance(payload, list) else [payload]


def import_lessons(payload, author):
    """Import one lesson dict or a list of them. Returns (created, errors)."""
    created, errors = [], []
    for index, item in enumerate(_as_list(payload)):
        error = _validate_lesson_item(item)
        if error:
            errors.append({"index": index, "title": item.get("title", ""), "error": error})
            continue
        with transaction.atomic():
            lesson = Lesson.objects.create(
                title=item["title"],
                language=item["language"],
                author=author,
                subject=Subject.objects.get(slug=item["subject"]),
                level=Level.objects.get(slug=item["level"]),
                content=item["content"],
                video_url=item.get("video_url") or None,
                translation_group=item.get("translation_group") or None,
                tags=item.get("tags", []),
                status=item.get("status", "draft"),
            )
        created.append({"id": lesson.id, "title": lesson.title})
    return created, errors


def _validate_lesson_item(item):
    if not isinstance(item, dict):
        return "item must be a JSON object"
    missing = [f for f in LESSON_REQUIRED_FIELDS if f not in item]
    if missing:
        return f"missing required fields: {', '.join(missing)}"
    if item["language"] not in ("ar", "fr"):
        return f"invalid language '{item['language']}' (must be 'ar' or 'fr')"
    if not Subject.objects.filter(slug=item["subject"]).exists():
        return f"subject with slug '{item['subject']}' does not exist"
    if not Level.objects.filter(slug=item["level"]).exists():
        return f"level with slug '{item['level']}' does not exist"
    content = item["content"]
    if not isinstance(content, dict) or not isinstance(content.get("blocks"), list):
        return 'content must be an object of the form {"blocks": [...]}'
    if item.get("status", "draft") not in ("draft", "published"):
        return f"invalid status '{item['status']}'"
    return None


def import_quizzes(payload, author):
    """Import one quiz dict or a list of them. Returns (created, errors)."""
    created, errors = [], []
    for index, item in enumerate(_as_list(payload)):
        error = _validate_quiz_item(item)
        if error:
            errors.append({"index": index, "title": item.get("title", ""), "error": error})
            continue

        lesson = None
        linked_title = item.get("linked_lesson_title")
        if linked_title:
            lesson = Lesson.objects.filter(
                title=linked_title, language=item["language"]
            ).first()
            if lesson is None:
                errors.append(
                    {
                        "index": index,
                        "title": item.get("title", ""),
                        "error": (
                            f"no lesson found with title '{linked_title}' "
                            f"and language '{item['language']}'"
                        ),
                    }
                )
                continue

        with transaction.atomic():
            quiz = Quiz.objects.create(
                title=item["title"],
                language=item["language"],
                author=author,
                lesson=lesson,
                level=Level.objects.get(slug=item["level"]),
                quiz_type=item.get("quiz_type", "lesson"),
                status=item.get("status", "draft"),
            )
            for q_index, q in enumerate(item["questions"]):
                question = Question.objects.create(
                    quiz=quiz, text=q["text"], order=q.get("order", q_index + 1)
                )
                Choice.objects.bulk_create(
                    Choice(
                        question=question,
                        text=c["text"],
                        is_correct=bool(c.get("is_correct", False)),
                    )
                    for c in q["choices"]
                )
        created.append({"id": quiz.id, "title": quiz.title})
    return created, errors


def _validate_quiz_item(item):
    if not isinstance(item, dict):
        return "item must be a JSON object"
    missing = [f for f in QUIZ_REQUIRED_FIELDS if f not in item]
    if missing:
        return f"missing required fields: {', '.join(missing)}"
    if item["language"] not in ("ar", "fr"):
        return f"invalid language '{item['language']}' (must be 'ar' or 'fr')"
    if not Level.objects.filter(slug=item["level"]).exists():
        return f"level with slug '{item['level']}' does not exist"
    if item.get("quiz_type", "lesson") not in ("lesson", "entrance_exam"):
        return f"invalid quiz_type '{item['quiz_type']}'"
    questions = item["questions"]
    if not isinstance(questions, list) or not questions:
        return "questions must be a non-empty list"
    for i, q in enumerate(questions):
        if not isinstance(q, dict) or not q.get("text"):
            return f"question {i}: missing 'text'"
        choices = q.get("choices")
        if not isinstance(choices, list) or len(choices) < 2:
            return f"question {i}: must have at least 2 choices"
        if not any(c.get("is_correct") for c in choices):
            return f"question {i}: no choice marked is_correct"
    return None


def export_lesson(lesson):
    """Serialize a lesson into the re-importable JSON schema."""
    return {
        "title": lesson.title,
        "language": lesson.language,
        "subject": lesson.subject.slug,
        "level": lesson.level.slug,
        "translation_group": lesson.translation_group,
        "tags": lesson.tags,
        "video_url": lesson.video_url,
        "content": lesson.content,
        "status": lesson.status,
    }


def export_quiz(quiz):
    """Serialize a quiz into the re-importable JSON schema."""
    return {
        "title": quiz.title,
        "language": quiz.language,
        "quiz_type": quiz.quiz_type,
        "linked_lesson_title": quiz.lesson.title if quiz.lesson else None,
        "level": quiz.level.slug,
        "status": quiz.status,
        "questions": [
            {
                "text": question.text,
                "order": question.order,
                "choices": [
                    {"text": choice.text, "is_correct": choice.is_correct}
                    for choice in question.choices.all()
                ],
            }
            for question in quiz.questions.all()
        ],
    }
