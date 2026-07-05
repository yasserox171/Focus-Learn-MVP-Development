import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { LessonListItem, Paginated } from '../api/types';
import { refName, useRefData } from '../pages/LessonsPage';

export default function LessonsAdminPage() {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const { subjects, levels } = useRefData();
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [filters, setFilters] = useState({ subject: '', level: '', status: '' });

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value;
    api
      .get<Paginated<LessonListItem>>('/lessons/', { params })
      .then((r) => setLessons(r.data.results));
  }, [filters]);

  useEffect(load, [load]);

  async function remove(id: number) {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await api.delete(`/lessons/${id}/`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{t('admin.lessons')}</h1>
        <Link className="btn btn-primary" to="/admin/lessons/new">
          + {t('admin.newLesson')}
        </Link>
      </div>
      <div className="filters">
        <select
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        >
          <option value="">
            {t('lessons.subject')}: {t('lessons.all')}
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {refName(s, uiLang)}
            </option>
          ))}
        </select>
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
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">
            {t('admin.status')}: {t('lessons.all')}
          </option>
          <option value="draft">{t('admin.draft')}</option>
          <option value="published">{t('admin.published')}</option>
        </select>
      </div>

      <table className="data-table">
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id}>
              <td dir={lesson.language === 'ar' ? 'rtl' : 'ltr'}>{lesson.title}</td>
              <td>{refName(lesson.subject, uiLang)}</td>
              <td>{refName(lesson.level, uiLang)}</td>
              <td>{lesson.language.toUpperCase()}</td>
              <td>
                <span className={`pill ${lesson.status === 'published' ? 'pill-ok' : ''}`}>
                  {t(`admin.${lesson.status}`)}
                </span>
              </td>
              <td className="row-actions">
                <Link className="btn btn-sm btn-ghost" to={`/admin/lessons/${lesson.id}`}>
                  {t('admin.edit')}
                </Link>
                <button className="btn btn-sm btn-danger" onClick={() => remove(lesson.id)}>
                  {t('admin.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
