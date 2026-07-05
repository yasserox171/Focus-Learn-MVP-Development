import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import type { Quiz, SubmitResult } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import MathText from '../components/MathText';

export default function QuizPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [warning, setWarning] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Quiz>(`/quizzes/${id}/`).then((r) => setQuiz(r.data));
  }, [id]);

  if (!quiz) return <p className="muted">{t('common.loading')}</p>;

  const dir = quiz.language === 'ar' ? 'rtl' : 'ltr';

  async function submit() {
    if (!quiz) return;
    if (Object.keys(answers).length < quiz.questions.length) {
      setWarning(true);
      return;
    }
    setWarning(false);
    setBusy(true);
    try {
      const { data } = await api.post<SubmitResult>(`/quizzes/${quiz.id}/submit/`, {
        answers,
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  function correctionFor(questionId: number) {
    return result?.correction.find((c) => c.question_id === questionId);
  }

  return (
    <div className="quiz-page" dir={dir}>
      <h1>{quiz.title}</h1>

      {result && (
        <div className="result-card">
          <h2>{t('quiz.result')}</h2>
          <div className="score">
            {result.score} / {result.total_questions}
          </div>
          <div className="result-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setResult(null);
                setAnswers({});
                window.scrollTo({ top: 0 });
              }}
            >
              {t('quiz.retake')}
            </button>
            <Link className="btn btn-primary" to="/lessons">
              {t('quiz.backToLessons')}
            </Link>
          </div>
        </div>
      )}

      {!user && <div className="alert alert-info">{t('quiz.loginToTake')}</div>}
      {warning && <div className="alert alert-error">{t('quiz.answerAll')}</div>}

      <ol className="questions">
        {quiz.questions.map((question, qIndex) => {
          const correction = correctionFor(question.id);
          return (
            <li key={question.id} className="question-card">
              <div className="question-head">
                <span className="q-number">
                  {t('quiz.question')} {qIndex + 1} {t('quiz.of')} {quiz.questions.length}
                </span>
                {correction && (
                  <span className={correction.is_correct ? 'pill pill-ok' : 'pill pill-bad'}>
                    {correction.is_correct ? t('quiz.correct') : t('quiz.wrong')}
                  </span>
                )}
              </div>
              <p className="question-text">
                <MathText text={question.text} />
              </p>
              <div className="choices">
                {question.choices.map((choice) => {
                  const selected = answers[question.id] === choice.id;
                  let cls = 'choice';
                  if (selected) cls += ' selected';
                  if (correction) {
                    if (choice.id === correction.correct_choice_id) cls += ' is-correct';
                    else if (selected && !correction.is_correct) cls += ' is-wrong';
                  }
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      className={cls}
                      disabled={!!result || !user}
                      onClick={() =>
                        setAnswers({ ...answers, [question.id]: choice.id })
                      }
                    >
                      <MathText text={choice.text} />
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {user && !result && (
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>
          {t('quiz.submit')}
        </button>
      )}
    </div>
  );
}
