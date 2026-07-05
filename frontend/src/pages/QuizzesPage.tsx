import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { Level, Paginated, QuizListItem } from '../api/types';
import { refName, useRefData } from './LessonsPage';

export default function QuizzesPage() {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const { levels } = useRefData() as { levels: Level[]; subjects: unknown };
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ level: '', quiz_type: '', language: '' });

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value;
    api
      .get<Paginated<QuizListItem>>('/quizzes/', { params })
      .then((r) => setQuizzes(r.data.results))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <h1 className="page-title">{t('quiz.title')}</h1>
      <div className="filters">
        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
        >
          <option value="">
            {t('lessons.level')}: {t('lessons.all')}
          </option>
          {levels.map((l) => (
            <option key={l.id} value={l.slug}>
              {refName(l, uiLang)}
            </option>
          ))}
        </select>
        <select
          value={filters.quiz_type}
          onChange={(e) => setFilters({ ...filters, quiz_type: e.target.value })}
        >
          <option value="">{t('lessons.all')}</option>
          <option value="lesson">{t('quiz.type_lesson')}</option>
          <option value="entrance_exam">{t('quiz.type_entrance_exam')}</option>
        </select>
        <select
          value={filters.language}
          onChange={(e) => setFilters({ ...filters, language: e.target.value })}
        >
          <option value="">
            {t('lessons.language')}: {t('lessons.all')}
          </option>
          <option value="ar">{t('lessons.arabic')}</option>
          <option value="fr">{t('lessons.french')}</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">{t('common.loading')}</p>
      ) : quizzes.length === 0 ? (
        <p className="muted">{t('quiz.empty')}</p>
      ) : (
        <div className="card-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card">
              <div className="card-badges">
                <span className="badge">{refName(quiz.level, uiLang)}</span>
                <span className="badge badge-lang">{quiz.language.toUpperCase()}</span>
                <span className="badge badge-type">{t(`quiz.type_${quiz.quiz_type}`)}</span>
              </div>
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
      )}
    </div>
  );
}
