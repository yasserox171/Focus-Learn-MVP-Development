import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/lessons');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{t('auth.loginTitle')}</h1>
      {error && <div className="alert alert-error">{t('auth.loginFailed')}</div>}
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.username')}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {t('auth.loginBtn')}
        </button>
      </form>
      <p className="auth-alt">
        {t('auth.noAccount')} <Link to="/register">{t('nav.register')}</Link>
      </p>
    </div>
  );
}
