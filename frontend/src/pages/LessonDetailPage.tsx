import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { Lesson, Paginated, QuizListItem } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import BlockRenderer from '../components/BlockRenderer';
import Seo, { toDescription } from '../components/Seo';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { refName } from './LessonsPage';

export default function LessonDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    api.get<Lesson>(`/lessons/${id}/`).then((r) => setLesson(r.data));
    api
      .get<Paginated<QuizListItem>>('/quizzes/', { params: { lesson: id } })
      .then((r) => setQuizzes(r.data.results));
  }, [id]);

  async function markCompleted() {
    await api.post(`/lessons/${id}/complete/`, { completed: true });
    setCompleted(true);
  }

  if (!lesson) return <p className="muted">{t('common.loading')}</p>;

  // The lesson body follows its own content language, independent of the UI
  const contentDir = lesson.language === 'ar' ? 'rtl' : 'ltr';

  const firstText = lesson.content.blocks.find(
    (b) => b.type === 'paragraph' || b.type === 'heading',
  );
  const description =
    firstText && 'text' in firstText ? toDescription(firstText.text) : undefined;

  return (
    <article className="lesson-detail">
      <Seo
        title={lesson.title}
        description={description}
        canonicalPath={`/lesson/${lesson.slug}/`}
        lang={lesson.language}
      />
      <div className="card-badges">
        <span className="badge badge-subject">{refName(lesson.subject, uiLang)}</span>
        <span className="badge">{refName(lesson.level, uiLang)}</span>
        <span className="badge badge-lang">{lesson.language.toUpperCase()}</span>
      </div>
      <div dir={contentDir} className="lesson-content">
        <h1>{lesson.title}</h1>
        <p className="muted small">
          {t('lessons.by')} {lesson.author_username}
        </p>
        <BlockRenderer blocks={lesson.content.blocks} />
        {lesson.video_url && (
          <section>
            <h2>{t('lessons.video')}</h2>
            <YouTubeEmbed url={lesson.video_url} />
          </section>
        )}
      </div>

      {user && (
        <button
          className={`btn ${completed ? 'btn-success' : 'btn-primary'}`}
          onClick={markCompleted}
          disabled={completed}
        >
          {completed ? `✓ ${t('progress.completed')}` : t('progress.markCompleted')}
        </button>
      )}

      {quizzes.length > 0 && (
        <section className="related-quizzes">
          <h2>{t('lessons.relatedQuizzes')}</h2>
          <div className="card-grid">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card">
                <h3 dir={quiz.language === 'ar' ? 'rtl' : 'ltr'}>{quiz.title}</h3>
                <p className="muted small">
                  {quiz.questions_count} {t('lessons.questions')}
                </p>
                <Link className="btn btn-primary" to={`/quizzes/${quiz.id}`}>
                  {t('lessons.startQuiz')}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
