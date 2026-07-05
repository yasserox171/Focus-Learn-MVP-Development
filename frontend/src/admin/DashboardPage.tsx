import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { DashboardStats } from '../api/types';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>('/admin/dashboard/').then((r) => setStats(r.data));
  }, []);

  if (!stats) return <p className="muted">{t('common.loading')}</p>;

  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-MA' : 'fr-FR';

  return (
    <div>
      <h1 className="page-title">{t('admin.dashboard')}</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.students_count}</div>
          <div className="stat-label">{t('admin.students')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.published_lessons_count}/{stats.lessons_count}
          </div>
          <div className="stat-label">{t('admin.publishedLessons')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.quizzes_count}</div>
          <div className="stat-label">{t('admin.totalQuizzes')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.attempts_count}</div>
          <div className="stat-label">{t('admin.totalAttempts')}</div>
        </div>
      </div>

      <h2>{t('admin.recentAttempts')}</h2>
      {stats.recent_attempts.length === 0 ? (
        <p className="muted">—</p>
      ) : (
        <table className="data-table">
          <tbody>
            {stats.recent_attempts.map((attempt, i) => (
              <tr key={i}>
                <td>{attempt.student}</td>
                <td>{attempt.quiz}</td>
                <td className="score-cell">
                  {attempt.score}/{attempt.total_questions}
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
