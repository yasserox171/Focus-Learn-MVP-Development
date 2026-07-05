import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { ImportResult, LessonListItem, Paginated, QuizListItem } from '../api/types';

export default function ImportExportPage() {
  const { t } = useTranslation();
  const [importKind, setImportKind] = useState<'lessons' | 'quizzes'>('lessons');
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<Set<number>>(new Set());
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<number>>(new Set());

  useEffect(() => {
    api
      .get<Paginated<LessonListItem>>('/lessons/')
      .then((r) => setLessons(r.data.results));
    api
      .get<Paginated<QuizListItem>>('/quizzes/')
      .then((r) => setQuizzes(r.data.results));
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setJsonText);
  }

  async function doImport() {
    setImportError(null);
    setResult(null);
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setImportError(t('admin.invalidJson'));
      return;
    }
    try {
      const { data } = await api.post<ImportResult>(
        `/admin/${importKind}/import/`,
        payload,
      );
      setResult(data);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: ImportResult } }).response?.data;
      if (data?.errors) setResult(data);
      else setImportError(t('common.error'));
    }
  }

  function toggle(set: Set<number>, id: number, apply: (s: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  }

  async function doExport() {
    const { data } = await api.post('/admin/export/', {
      lesson_ids: [...selectedLessons],
      quiz_ids: [...selectedQuizzes],
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focus-learn-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="page-title">{t('admin.importExport')}</h1>

      <section className="panel">
        <h2>{t('admin.importTitle')}</h2>
        <div className="filters">
          <select
            value={importKind}
            onChange={(e) => setImportKind(e.target.value as 'lessons' | 'quizzes')}
          >
            <option value="lessons">{t('admin.importLessons')}</option>
            <option value="quizzes">{t('admin.importQuizzes')}</option>
          </select>
          <input type="file" accept="application/json" onChange={onFile} />
        </div>
        <p className="muted small">{t('admin.importHint')}</p>
        <textarea
          className="json-input"
          dir="ltr"
          rows={10}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='[{"title": "...", ...}]'
        />
        <button className="btn btn-primary" onClick={doImport} disabled={!jsonText.trim()}>
          {t('admin.importBtn')}
        </button>

        {importError && <div className="alert alert-error">{importError}</div>}
        {result && (
          <div className="import-result">
            <div className="alert alert-success">
              {t('admin.importCreated')}: {result.created.length}
              {result.created.length > 0 && (
                <ul>
                  {result.created.map((item) => (
                    <li key={item.id}>{item.title}</li>
                  ))}
                </ul>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="alert alert-error">
                {t('admin.importErrors')}: {result.errors.length}
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      [{e.index}] {e.title || '?'} — <code dir="ltr">{e.error}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{t('admin.exportTitle')}</h2>
        <p className="muted small">{t('admin.exportHint')}</p>
        <div className="export-columns">
          <div>
            <h3>{t('nav.lessons')}</h3>
            {lessons.map((lesson) => (
              <label key={lesson.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedLessons.has(lesson.id)}
                  onChange={() => toggle(selectedLessons, lesson.id, setSelectedLessons)}
                />
                <span dir={lesson.language === 'ar' ? 'rtl' : 'ltr'}>{lesson.title}</span>
              </label>
            ))}
          </div>
          <div>
            <h3>{t('nav.quizzes')}</h3>
            {quizzes.map((quiz) => (
              <label key={quiz.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedQuizzes.has(quiz.id)}
                  onChange={() => toggle(selectedQuizzes, quiz.id, setSelectedQuizzes)}
                />
                <span dir={quiz.language === 'ar' ? 'rtl' : 'ltr'}>{quiz.title}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={doExport}
          disabled={selectedLessons.size === 0 && selectedQuizzes.size === 0}
        >
          {t('admin.exportBtn')}
        </button>
      </section>
    </div>
  );
}
