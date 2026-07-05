# Focus Learn — MVP

منصة تعليمية تفاعلية للتلاميذ (عربي/فرنسي) — Interactive learning platform MVP, built to scale later into a full educational social platform (teachers, parents, live streaming).

## Stack

| Layer | Tech |
|---|---|
| Backend | Django + Django REST Framework, JWT (`djangorestframework-simplejwt`) |
| Database | SQLite (dev, Termux-friendly) → PostgreSQL-ready via env vars, no code changes |
| Frontend | React + Vite + TypeScript |
| Editor | TipTap (StarterKit, Image, `@tiptap/extension-mathematics`) |
| Math | KaTeX (`react-katex`) |
| i18n | i18next + react-i18next (ar/fr, auto-detect + manual switch) |
| Video | YouTube (unlisted) embeds — no self-hosted video |
| Mobile | Flutter (Android/iOS/web) student app — same API, same content blocks |

## Quick start

### Backend (port 8000)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed          # creates admin user + subjects/levels + sample lesson & quiz
python manage.py runserver
```

The `seed` command creates the admin account `admin` / `admin1234`
(override with `python manage.py seed --admin-password <pwd>`).

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000` (see `frontend/vite.config.ts`).

### Mobile app (Flutter)

```bash
cd mobile
flutter pub get
flutter run          # device/emulator; APK: flutter build apk --release
```

The student-facing mobile app consumes the same API and renders the same
`content.blocks` JSON (LaTeX via `flutter_math_fork`, YouTube links open
externally). The server URL is configurable on the login screen and defaults
to `http://10.0.2.2:8000` (Android emulator → host loopback). UI language
(ar/fr, full RTL/LTR) follows the same rules as the web frontend. Tests:
`flutter test` (includes a live-API integration test that runs when the
backend is up on 127.0.0.1:8000).

## Architecture notes

- **Roles from day one**: the `User` model carries `role` ∈ admin/teacher/student/parent.
  The MVP UI only exposes student registration and the admin panel, but the schema,
  permissions (`IsAdmin`, `IsStudent`, `IsAdminOrReadOnly`) and `ParentStudentLink`
  are already multi-role so no restructuring is needed later.
- **Structured lesson content**: `Lesson.content` stores `{ "blocks": [...] }`
  (heading / paragraph / latex / image / video). The React frontend renders each
  block type; a future Flutter app reads the same JSON. The TipTap admin editor
  converts its document to blocks on save — raw HTML is never stored.
- **Content language ≠ UI language**: the interface language (i18next, `dir` on
  `<html>`) is independent from each lesson's own language, which sets its own
  text direction. `translation_group` links ar/fr versions of the same lesson.
- **Import/Export**: `POST /api/admin/lessons/import/` and
  `POST /api/admin/quizzes/import/` accept a single JSON object or an array,
  validate subject/level slugs (clear per-item errors), resolve
  `linked_lesson_title` by title + language, and set the importer as author.
  `POST /api/admin/export/` takes `{lesson_ids, quiz_ids}` and returns
  re-importable JSON. The admin UI wraps all of this with file upload/download.

## API overview

```
POST /api/auth/register/            student sign-up
POST /api/auth/login/               JWT pair + user profile
POST /api/auth/refresh/
GET  /api/me/  PATCH /api/me/       profile (incl. preferred_ui_language)
GET  /api/me/attempts/              quiz history
GET  /api/me/progress/              completed lessons, average score
GET  /api/subjects/  /api/levels/
GET  /api/lessons/?subject=&level=&language=&search=
GET  /api/lessons/<id>/             POST /api/lessons/<id>/complete/
GET  /api/quizzes/?lesson=&level=&quiz_type=   (no is_correct in responses)
POST /api/quizzes/<id>/submit/      grade + create Attempt + correction
POST /api/admin/lessons/import/     POST /api/admin/quizzes/import/
POST /api/admin/export/             GET  /api/admin/dashboard/
```

Admin-only write access on lessons/quizzes/subjects/levels is enforced by
`request.user.role == 'admin'`; drafts are only visible to admins.

## Tests / verification

The stack was verified end-to-end (Playwright): student registration → login →
lesson browsing with filters → KaTeX rendering → quiz taking with instant
correction → progress dashboard → RTL/LTR switch → admin dashboard → TipTap
lesson editing with lossless block round-trip → quiz builder → JSON
import/export.
