"""Helpers for the server-rendered public (SEO) pages.

These pages exist so search-engine crawlers, social previews and AI search
receive fully-rendered HTML (the React SPA only renders in the browser).
"""

import re

from django.conf import settings

YOUTUBE_PATTERNS = [
    re.compile(r"youtube\.com/watch\?.*v=([\w-]{11})"),
    re.compile(r"youtu\.be/([\w-]{11})"),
    re.compile(r"youtube\.com/embed/([\w-]{11})"),
    re.compile(r"youtube\.com/shorts/([\w-]{11})"),
]


def youtube_id(url):
    if not url:
        return None
    for pattern in YOUTUBE_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    return None


def _strip_math(text):
    """Remove $...$ LaTeX delimiters and collapse whitespace for plain-text
    contexts (meta description, Open Graph)."""
    text = re.sub(r"\$([^$]*)\$", r"\1", text or "")
    return re.sub(r"\s+", " ", text).strip()


def meta_description(lesson, limit=160):
    """First readable paragraph/heading of a lesson, trimmed for <meta>."""
    for block in lesson.content.get("blocks", []):
        if block.get("type") in ("paragraph", "heading") and block.get("text"):
            text = _strip_math(block["text"])
            if len(text) >= 40:
                return text[:limit].rsplit(" ", 1)[0] + ("…" if len(text) > limit else "")
    # Fallback: subject + level
    return _strip_math(lesson.title)[:limit]


def quiz_description(quiz, limit=160):
    n = quiz.questions.count()
    label = "أسئلة" if quiz.language == "ar" else "questions"
    intro = quiz.title
    return f"{_strip_math(intro)} — {n} {label}"[:limit]


def absolute_url(path):
    return settings.SITE_URL.rstrip("/") + path


def app_url(path=""):
    return settings.FRONTEND_URL.rstrip("/") + path


def hreflang_alternates(lesson):
    """Return [{lang, url}] for language versions of the same lesson,
    linked via translation_group. Includes the lesson itself."""
    from .models import Lesson

    alternates = []
    seen_langs = set()
    group = lesson.translation_group
    if group:
        siblings = Lesson.objects.filter(
            translation_group=group, status="published"
        ).order_by("language")
        for sib in siblings:
            if sib.language in seen_langs:
                continue
            seen_langs.add(sib.language)
            alternates.append(
                {"lang": sib.language, "url": absolute_url(f"/lesson/{sib.slug}/")}
            )
    if lesson.language not in seen_langs:
        alternates.append(
            {"lang": lesson.language, "url": absolute_url(f"/lesson/{lesson.slug}/")}
        )
    return alternates
