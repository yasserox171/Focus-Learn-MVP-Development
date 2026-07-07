"""Server-rendered public pages for SEO.

Only published content is exposed here. Each page ships full HTML content
plus title/description/canonical/hreflang/Open Graph/JSON-LD so crawlers and
social/AI previews get everything without executing JavaScript.
"""

import json

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_GET

from quizzes.models import Quiz

from . import seo
from .models import Lesson, Level, Subject


def _subject_name(subject, lang):
    return subject.name_ar if lang == "ar" else subject.name_fr


def _level_name(level, lang):
    return level.name_ar if lang == "ar" else level.name_fr


@require_GET
def lesson_page(request, slug):
    lesson = get_object_or_404(
        Lesson.objects.select_related("subject", "level", "author"),
        slug=slug,
        status="published",
    )
    blocks = lesson.content.get("blocks", [])
    # Attach a resolved youtube id to video blocks for the template
    for block in blocks:
        if block.get("type") == "video":
            block["youtube_id"] = seo.youtube_id(block.get("url"))
    alternates = seo.hreflang_alternates(lesson)
    related = (
        Lesson.objects.filter(
            subject=lesson.subject, level=lesson.level, status="published"
        )
        .exclude(pk=lesson.pk)
        .order_by("-created_at")[:6]
    )
    quizzes = Quiz.objects.filter(lesson=lesson, status="published")

    jsonld = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": lesson.title,
        "inLanguage": lesson.language,
        "description": seo.meta_description(lesson),
        "url": seo.absolute_url(f"/lesson/{lesson.slug}/"),
        "learningResourceType": "lesson",
        "educationalLevel": _level_name(lesson.level, lesson.language),
        "about": _subject_name(lesson.subject, lesson.language),
        "datePublished": lesson.created_at.date().isoformat(),
        "dateModified": lesson.updated_at.date().isoformat(),
        "isAccessibleForFree": True,
    }

    context = {
        "lesson": lesson,
        "blocks": blocks,
        "video_id": seo.youtube_id(lesson.video_url),
        "alternates": alternates,
        "related": related,
        "quizzes": quizzes,
        "subject_name": _subject_name(lesson.subject, lesson.language),
        "level_name": _level_name(lesson.level, lesson.language),
        "page_title": f"{lesson.title} | Focus Learn",
        "page_description": seo.meta_description(lesson),
        "canonical": seo.absolute_url(f"/lesson/{lesson.slug}/"),
        "app_link": seo.app_url(f"/lessons/{lesson.id}"),
        "lang": lesson.language,
        "dir": "rtl" if lesson.language == "ar" else "ltr",
        "jsonld": json.dumps(jsonld, ensure_ascii=False),
    }
    return render(request, "seo/lesson.html", context)


@require_GET
def quiz_page(request, slug):
    quiz = get_object_or_404(
        Quiz.objects.select_related("level", "lesson").prefetch_related("questions"),
        slug=slug,
        status="published",
    )
    jsonld = {
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": quiz.title,
        "inLanguage": quiz.language,
        "url": seo.absolute_url(f"/quiz/{quiz.slug}/"),
        "educationalLevel": _level_name(quiz.level, quiz.language),
        "numberOfQuestions": quiz.questions.count(),
        "isAccessibleForFree": True,
    }
    context = {
        "quiz": quiz,
        "questions": quiz.questions.all(),
        "level_name": _level_name(quiz.level, quiz.language),
        "page_title": f"{quiz.title} | Focus Learn",
        "page_description": seo.quiz_description(quiz),
        "canonical": seo.absolute_url(f"/quiz/{quiz.slug}/"),
        "app_link": seo.app_url(f"/quizzes/{quiz.id}"),
        "lang": quiz.language,
        "dir": "rtl" if quiz.language == "ar" else "ltr",
        "jsonld": json.dumps(jsonld, ensure_ascii=False),
    }
    return render(request, "seo/quiz.html", context)


@require_GET
def category_page(request, subject_slug, level_slug):
    subject = get_object_or_404(Subject, slug=subject_slug)
    level = get_object_or_404(Level, slug=level_slug)
    lessons = Lesson.objects.filter(
        subject=subject, level=level, status="published"
    ).order_by("-created_at")
    quizzes = Quiz.objects.filter(
        level=level, status="published", lesson__subject=subject
    ).distinct()

    # Category pages target broad queries; default to Arabic naming
    subject_ar = subject.name_ar
    level_ar = level.name_ar
    title = f"دروس واختبارات {subject_ar} — {level_ar}"
    description = (
        f"دروس واختبارات {subject_ar} لمستوى {level_ar} على Focus Learn: "
        f"شروحات، تمارين محلولة، واختبارات تفاعلية مجانية."
    )
    context = {
        "subject": subject,
        "level": level,
        "subject_ar": subject_ar,
        "subject_fr": subject.name_fr,
        "level_ar": level_ar,
        "level_fr": level.name_fr,
        "lessons": lessons,
        "quizzes": quizzes,
        "page_title": f"{title} | Focus Learn",
        "page_description": description,
        "canonical": seo.absolute_url(f"/lessons/{subject.slug}/{level.slug}/"),
        "app_link": seo.app_url("/lessons"),
        "lang": "ar",
        "dir": "rtl",
    }
    return render(request, "seo/category.html", context)


@require_GET
def seo_index(request):
    subjects = Subject.objects.all().order_by("slug")
    levels = Level.objects.all().order_by("order", "id")
    # Only category combos that actually have published lessons
    combos = []
    for level in levels:
        for subject in subjects:
            if Lesson.objects.filter(
                subject=subject, level=level, status="published"
            ).exists():
                combos.append({"subject": subject, "level": level})
    context = {
        "combos": combos,
        "recent": Lesson.objects.filter(status="published").order_by("-created_at")[:12],
        "page_title": "Focus Learn — دروس واختبارات تفاعلية للتلاميذ",
        "page_description": (
            "منصة Focus Learn: دروس واختبارات تفاعلية في الرياضيات والفيزياء "
            "وعلوم الحياة والأرض، بالعربية والفرنسية، لمختلف المستويات."
        ),
        "canonical": seo.absolute_url("/"),
        "app_link": seo.app_url("/"),
        "lang": "ar",
        "dir": "rtl",
    }
    return render(request, "seo/index.html", context)


@require_GET
def robots_txt(request):
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "Disallow: /django-admin/",
        f"Sitemap: {seo.absolute_url('/sitemap.xml')}",
    ]
    return HttpResponse("\n".join(lines) + "\n", content_type="text/plain")
