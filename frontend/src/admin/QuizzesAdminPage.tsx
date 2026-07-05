import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { Paginated, QuizListItem } from '../api/types';
import { refName } from '../pages/LessonsPage';

export default function QuizzesAdminPage() {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);

  const load = useCallback(() => {
    api
      .get<Paginated<QuizListItem>>('/quizzes/')
      .then((r) => setQuizzes(r.data.results));
  }, []);

  useEffect(load, [load]);

  async function remove(id: number) {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await api.delete(`/quizzes/${id}/`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{t('admin.quizzes')}</h1>
        <Link className="btn btn-primary" to="/admin/quizzes/new">
          + {t('admin.newQuiz')}
        </Link>
      </div>
      <table className="data-table">
        <tbody>
          {quizzes.map((quiz) => (
            <tr key={quiz.id}>
              <td dir={quiz.language === 'ar' ? 'rtl' : 'ltr'}>{quiz.title}</td>
              <td>{refName(quiz.level, uiLang)}</td>
              <td>{t(`quiz.type_${quiz.quiz_type}`)}</td>
              <td>{quiz.questions_count}</td>
              <td>
                <span className={`pill ${quiz.status === 'published' ? 'pill-ok' : ''}`}>
                  {t(`admin.${quiz.status}`)}
                </span>
              </td>
              <td className="row-actions">
                <Link className="btn btn-sm btn-ghost" to={`/admin/quizzes/${quiz.id}`}>
                  {t('admin.edit')}
                </Link>
                <button className="btn btn-sm btn-danger" onClick={() => remove(quiz.id)}>
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
