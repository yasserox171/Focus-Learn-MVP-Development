import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: e.target.value });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/register/', {
        ...form,
        preferred_ui_language: i18n.resolvedLanguage ?? 'ar',
      });
      await login(form.username, form.password);
      navigate('/lessons');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })
        .response?.data;
      const detail = data ? Object.values(data).flat().join(' ') : null;
      setError(detail || t('auth.registerFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{t('auth.registerTitle')}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.username')}
          <input value={form.username} onChange={set('username')} required autoFocus />
        </label>
        <label>
          {t('auth.email')}
          <input type="email" value={form.email} onChange={set('email')} />
        </label>
        <div className="form-row">
          <label>
            {t('auth.firstName')}
            <input value={form.first_name} onChange={set('first_name')} />
          </label>
          <label>
            {t('auth.lastName')}
            <input value={form.last_name} onChange={set('last_name')} />
          </label>
        </div>
        <label>
          {t('auth.password')}
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {t('auth.registerBtn')}
        </button>
      </form>
      <p className="auth-alt">
        {t('auth.haveAccount')} <Link to="/login">{t('nav.login')}</Link>
      </p>
    </div>
  );
}
