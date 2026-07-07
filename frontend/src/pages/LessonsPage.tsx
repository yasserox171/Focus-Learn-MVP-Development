import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { LessonListItem, Level, Paginated, Subject } from '../api/types';
import Seo from '../components/Seo';

export function useRefData() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  useEffect(() => {
    api.get<Subject[]>('/subjects/').then((r) => setSubjects(r.data));
    api.get<Level[]>('/levels/').then((r) => setLevels(r.data));
  }, []);
  return { subjects, levels };
}

export function refName(item: { name_ar: string; name_fr: string }, uiLang: string) {
  return uiLang === 'ar' ? item.name_ar : item.name_fr;
}

export default function LessonsPage() {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const { subjects, levels } = useRefData();
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject: '', level: '', language: '', search: '' });

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value;
    api
      .get<Paginated<LessonListItem>>('/lessons/', { params })
      .then((r) => setLessons(r.data.results))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <Seo
        title={t('lessons.title')}
        description="تصفّح دروس واختبارات Focus Learn في الرياضيات والفيزياء وعلوم الحياة والأرض حسب المادة والمستوى واللغة."
      />
      <h1 className="page-title">{t('lessons.title')}</h1>
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
          value={filters.language}
          onChange={(e) => setFilters({ ...filters, language: e.target.value })}
        >
          <option value="">
            {t('lessons.language')}: {t('lessons.all')}
          </option>
          <option value="ar">{t('lessons.arabic')}</option>
          <option value="fr">{t('lessons.french')}</option>
        </select>
        <input
          className="search-input"
          placeholder={t('lessons.search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {loading ? (
        <p className="muted">{t('common.loading')}</p>
      ) : lessons.length === 0 ? (
        <p className="muted">{t('lessons.empty')}</p>
      ) : (
        <div className="card-grid">
          {lessons.map((lesson) => (
            <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="card lesson-card">
              <div className="card-badges">
                <span className="badge badge-subject">{refName(lesson.subject, uiLang)}</span>
                <span className="badge">{refName(lesson.level, uiLang)}</span>
                <span className="badge badge-lang">{lesson.language.toUpperCase()}</span>
              </div>
              <h3 dir={lesson.language === 'ar' ? 'rtl' : 'ltr'}>{lesson.title}</h3>
              {lesson.tags.length > 0 && (
                <div className="tags">
                  {lesson.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
