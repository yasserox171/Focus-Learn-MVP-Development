import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { LessonListItem, Paginated, Quiz } from '../api/types';
import MathText from '../components/MathText';
import { refName, useRefData } from '../pages/LessonsPage';

interface EditableChoice {
  text: string;
  is_correct: boolean;
}

interface EditableQuestion {
  text: string;
  order: number;
  choices: EditableChoice[];
}

const emptyQuestion = (order: number): EditableQuestion => ({
  text: '',
  order,
  choices: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
  ],
});

export default function QuizEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const navigate = useNavigate();
  const { levels } = useRefData();

  const [meta, setMeta] = useState({
    title: '',
    language: 'ar' as 'ar' | 'fr',
    level_id: 0,
    lesson: null as number | null,
    quiz_type: 'lesson' as 'lesson' | 'entrance_exam',
  });
  const [questions, setQuestions] = useState<EditableQuestion[]>([emptyQuestion(1)]);
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    api
      .get<Paginated<LessonListItem>>('/lessons/')
      .then((r) => setLessons(r.data.results));
  }, []);

  useEffect(() => {
    if (isNew) return;
    api.get<Quiz>(`/quizzes/${id}/`).then((r) => {
      const quiz = r.data;
      setMeta({
        title: quiz.title,
        language: quiz.language,
        level_id: quiz.level.id,
        lesson: quiz.lesson,
        quiz_type: quiz.quiz_type,
      });
      setQuestions(
        quiz.questions.map((question) => ({
          text: question.text,
          order: question.order,
          choices: question.choices.map((choice) => ({
            text: choice.text,
            is_correct: !!choice.is_correct,
          })),
        })),
      );
      setLoaded(true);
    });
  }, [id, isNew]);

  function updateQuestion(qIndex: number, patch: Partial<EditableQuestion>) {
    setQuestions(questions.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  }

  function updateChoice(qIndex: number, cIndex: number, patch: Partial<EditableChoice>) {
    const question = questions[qIndex];
    const choices = question.choices.map((c, i) =>
      i === cIndex ? { ...c, ...patch } : patch.is_correct ? { ...c, is_correct: false } : c,
    );
    updateQuestion(qIndex, { choices });
  }

  async function save(status: 'draft' | 'published') {
    setMessage(null);
    const payload = {
      title: meta.title,
      language: meta.language,
      level_id: meta.level_id,
      lesson: meta.lesson,
      quiz_type: meta.quiz_type,
      status,
      questions: questions.map((question, qIndex) => ({
        text: question.text,
        order: qIndex + 1,
        choices: question.choices,
      })),
    };
    try {
      if (isNew) {
        await api.post('/quizzes/', payload);
      } else {
        await api.put(`/quizzes/${id}/`, payload);
      }
      navigate('/admin/quizzes');
    } catch {
      setMessage(t('admin.saveFailed'));
    }
  }

  if (!loaded) return <p className="muted">{t('common.loading')}</p>;

  const dir = meta.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="editor-page">
      <div className="page-head">
        <h1 className="page-title">{isNew ? t('admin.newQuiz') : t('admin.edit')}</h1>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={() => save('draft')}>
            {t('admin.saveDraft')}
          </button>
          <button className="btn btn-primary" onClick={() => save('published')}>
            {t('admin.publish')}
          </button>
        </div>
      </div>
      {message && <div className="alert alert-error">{message}</div>}

      <div className="editor-meta">
        <label className="span-2">
          {t('admin.title')}
          <input
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            dir={dir}
          />
        </label>
        <label>
          {t('lessons.language')}
          <select
            value={meta.language}
            onChange={(e) => setMeta({ ...meta, language: e.target.value as 'ar' | 'fr' })}
          >
            <option value="ar">{t('lessons.arabic')}</option>
            <option value="fr">{t('lessons.french')}</option>
          </select>
        </label>
        <label>
          {t('lessons.level')}
          <select
            value={meta.level_id}
            onChange={(e) => setMeta({ ...meta, level_id: Number(e.target.value) })}
          >
            <option value={0}>—</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {refName(l, uiLang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.quizType')}
          <select
            value={meta.quiz_type}
            onChange={(e) =>
              setMeta({ ...meta, quiz_type: e.target.value as 'lesson' | 'entrance_exam' })
            }
          >
            <option value="lesson">{t('quiz.type_lesson')}</option>
            <option value="entrance_exam">{t('quiz.type_entrance_exam')}</option>
          </select>
        </label>
        <label>
          {t('admin.linkedLesson')}
          <select
            value={meta.lesson ?? ''}
            onChange={(e) =>
              setMeta({ ...meta, lesson: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">{t('admin.none')}</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ol className="question-editor-list" dir={dir}>
        {questions.map((question, qIndex) => (
          <li key={qIndex} className="question-card">
            <div className="question-head">
              <strong>
                {t('quiz.question')} {qIndex + 1}
              </strong>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                disabled={questions.length === 1}
              >
                {t('admin.removeQuestion')}
              </button>
            </div>
            <textarea
              placeholder={t('admin.questionText')}
              value={question.text}
              onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
              rows={2}
            />
            {question.text.includes('$') && (
              <div className="latex-preview">
                <MathText text={question.text} />
              </div>
            )}
            <div className="choice-editor-list">
              {question.choices.map((choice, cIndex) => (
                <div key={cIndex} className="choice-editor">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={choice.is_correct}
                    onChange={() => updateChoice(qIndex, cIndex, { is_correct: true })}
                    title={t('admin.correctChoice')}
                  />
                  <input
                    className="choice-text"
                    value={choice.text}
                    onChange={(e) => updateChoice(qIndex, cIndex, { text: e.target.value })}
                  />
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() =>
                      updateQuestion(qIndex, {
                        choices: question.choices.filter((_, i) => i !== cIndex),
                      })
                    }
                    disabled={question.choices.length <= 2}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() =>
                  updateQuestion(qIndex, {
                    choices: [...question.choices, { text: '', is_correct: false }],
                  })
                }
              >
                + {t('admin.addChoice')}
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        className="btn btn-ghost"
        onClick={() => setQuestions([...questions, emptyQuestion(questions.length + 1)])}
      >
        + {t('admin.addQuestion')}
      </button>
    </div>
  );
}
