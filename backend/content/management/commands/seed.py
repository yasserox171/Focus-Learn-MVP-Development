"""Seed the database with the admin user, reference data, and a sample
lesson + quiz in both languages, so the app is usable right after setup.

Usage: python manage.py seed [--admin-password PASSWORD]
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from content.models import Lesson, Level, Subject
from quizzes.models import Choice, Question, Quiz

User = get_user_model()

SUBJECTS = [
    {"slug": "mathematics", "name_ar": "الرياضيات", "name_fr": "Mathématiques"},
    {"slug": "physics", "name_ar": "الفيزياء", "name_fr": "Physique"},
    {"slug": "svt", "name_ar": "علوم الحياة والأرض", "name_fr": "SVT"},
]

LEVELS = [
    {"slug": "tronc_commun", "name_ar": "الجذع المشترك", "name_fr": "Tronc commun", "order": 1},
    {"slug": "bac1_sciences", "name_ar": "الأولى باك علوم", "name_fr": "1ère Bac Sciences", "order": 2},
    {"slug": "bac_sciences_math", "name_ar": "الثانية باك علوم رياضية", "name_fr": "2ème Bac Sciences Maths", "order": 3},
]


class Command(BaseCommand):
    help = "Seed reference data, the admin account, and sample content"

    def add_arguments(self, parser):
        parser.add_argument("--admin-password", default="admin1234")

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"role": "admin", "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password(options["admin_password"])
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin user 'admin'"))

        for data in SUBJECTS:
            Subject.objects.get_or_create(slug=data["slug"], defaults=data)
        for data in LEVELS:
            Level.objects.get_or_create(slug=data["slug"], defaults=data)
        self.stdout.write(self.style.SUCCESS("Subjects and levels seeded"))

        math = Subject.objects.get(slug="mathematics")
        bac = Level.objects.get(slug="bac_sciences_math")

        lesson_ar, _ = Lesson.objects.get_or_create(
            title="المعادلات من الدرجة الثانية",
            language="ar",
            defaults={
                "author": admin,
                "subject": math,
                "level": bac,
                "translation_group": "quad-equations-01",
                "tags": ["algebra", "second_degree"],
                "status": "published",
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "المعادلات من الدرجة الثانية"},
                        {
                            "type": "paragraph",
                            "text": "المعادلة من الدرجة الثانية هي معادلة على الشكل التالي حيث a لا تساوي صفراً:",
                        },
                        {"type": "latex", "text": "ax^2 + bx + c = 0"},
                        {"type": "paragraph", "text": "نحسب المميز دلتا:"},
                        {"type": "latex", "text": "\\Delta = b^2 - 4ac"},
                        {
                            "type": "paragraph",
                            "text": "إذا كان المميز موجباً فللمعادلة حلان، وإذا كان منعدماً فلها حل مزدوج، وإذا كان سالباً فلا حل لها في مجموعة الأعداد الحقيقية.",
                        },
                    ]
                },
            },
        )

        Lesson.objects.get_or_create(
            title="Les équations du second degré",
            language="fr",
            defaults={
                "author": admin,
                "subject": math,
                "level": bac,
                "translation_group": "quad-equations-01",
                "tags": ["algebra", "second_degree"],
                "status": "published",
                "content": {
                    "blocks": [
                        {"type": "heading", "text": "Les équations du second degré"},
                        {
                            "type": "paragraph",
                            "text": "Une équation du second degré s'écrit sous la forme suivante, avec a non nul :",
                        },
                        {"type": "latex", "text": "ax^2 + bx + c = 0"},
                        {"type": "paragraph", "text": "On calcule le discriminant :"},
                        {"type": "latex", "text": "\\Delta = b^2 - 4ac"},
                        {
                            "type": "paragraph",
                            "text": "Si Δ > 0 l'équation admet deux solutions, si Δ = 0 une solution double, et si Δ < 0 aucune solution réelle.",
                        },
                    ]
                },
            },
        )

        quiz, quiz_created = Quiz.objects.get_or_create(
            title="اختبار: المعادلات من الدرجة الثانية",
            language="ar",
            defaults={
                "author": admin,
                "lesson": lesson_ar,
                "level": bac,
                "quiz_type": "lesson",
                "status": "published",
            },
        )
        if quiz_created:
            q1 = Question.objects.create(
                quiz=quiz, order=1, text="ما هو مميز المعادلة $x^2 - 5x + 6 = 0$؟"
            )
            Choice.objects.bulk_create(
                [
                    Choice(question=q1, text="1", is_correct=True),
                    Choice(question=q1, text="-1"),
                    Choice(question=q1, text="25"),
                    Choice(question=q1, text="0"),
                ]
            )
            q2 = Question.objects.create(
                quiz=quiz, order=2, text="إذا كان $\\Delta < 0$ فإن المعادلة:"
            )
            Choice.objects.bulk_create(
                [
                    Choice(question=q2, text="لها حلان"),
                    Choice(question=q2, text="لها حل مزدوج"),
                    Choice(question=q2, text="لا حل لها في R", is_correct=True),
                ]
            )

        self.stdout.write(self.style.SUCCESS("Sample lessons and quiz seeded"))
