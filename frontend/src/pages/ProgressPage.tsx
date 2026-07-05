import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { Attempt, Paginated, Progress } from '../api/types';

export default function ProgressPage() {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    api.get<Progress>('/me/progress/').then((r) => setProgress(r.data));
    api
      .get<Paginated<Attempt>>('/me/attempts/')
      .then((r) => setAttempts(r.data.results));
  }, []);

  if (!progress) return <p className="muted">{t('common.loading')}</p>;

  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-MA' : 'fr-FR';

  return (
    <div>
      <h1 className="page-title">{t('progress.title')}</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{progress.completed_lessons}</div>
          <div className="stat-label">{t('progress.completedLessons')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.viewed_lessons}</div>
          <div className="stat-label">{t('progress.viewedLessons')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.attempts_count}</div>
          <div className="stat-label">{t('progress.attempts')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {progress.average_score_pct != null ? `${progress.average_score_pct}%` : '—'}
          </div>
          <div className="stat-label">{t('progress.avgScore')}</div>
        </div>
      </div>

      <h2>{t('progress.history')}</h2>
      {attempts.length === 0 ? (
        <p className="muted">{t('progress.emptyHistory')}</p>
      ) : (
        <table className="data-table">
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td>{attempt.quiz_title}</td>
                <td className="score-cell">
                  {attempt.score} / {attempt.total_questions}
                </td>
                <td className="muted small">
                  {new Date(attempt.completed_at).toLocaleString(locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
