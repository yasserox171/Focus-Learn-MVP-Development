"""XML sitemaps listing all published, indexable pages so search engines can
discover every lesson, quiz and category landing page."""

from django.contrib.sitemaps import Sitemap
from django.db.models import Count

from quizzes.models import Quiz

from .models import Lesson


class LessonSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Lesson.objects.filter(status="published").order_by("id")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/lesson/{obj.slug}/"


class QuizSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Quiz.objects.filter(status="published").order_by("id")

    def location(self, obj):
        return f"/quiz/{obj.slug}/"


class CategorySitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        # Distinct (subject, level) pairs that have published lessons
        pairs = (
            Lesson.objects.filter(status="published")
            .values_list("subject__slug", "level__slug")
            .annotate(n=Count("id"))
            .order_by("subject__slug", "level__slug")
        )
        return [{"subject": s, "level": lv} for s, lv, _ in pairs]

    def location(self, obj):
        return f"/lessons/{obj['subject']}/{obj['level']}/"


class StaticSitemap(Sitemap):
    protocol = "https"
    changefreq = "daily"
    priority = 1.0

    def items(self):
        return ["/"]

    def location(self, obj):
        return obj


SITEMAPS = {
    "static": StaticSitemap,
    "categories": CategorySitemap,
    "lessons": LessonSitemap,
    "quizzes": QuizSitemap,
}
