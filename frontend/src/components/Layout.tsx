import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout, setUiLanguage } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.resolvedLanguage ?? 'ar';

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">FL</span>
          {t('app.name')}
        </Link>
        <nav className="main-nav">
          <NavLink to="/lessons">{t('nav.lessons')}</NavLink>
          <NavLink to="/quizzes">{t('nav.quizzes')}</NavLink>
          {user && <NavLink to="/progress">{t('nav.progress')}</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">{t('nav.admin')}</NavLink>}
        </nav>
        <div className="topbar-actions">
          <div className="lang-switch" title={t('common.uiLanguage')}>
            <button
              className={lang === 'ar' ? 'active' : ''}
              onClick={() => setUiLanguage('ar')}
            >
              ع
            </button>
            <button
              className={lang === 'fr' ? 'active' : ''}
              onClick={() => setUiLanguage('fr')}
            >
              FR
            </button>
          </div>
          {user ? (
            <>
              <span className="username">{user.username}</span>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                {t('nav.login')}
              </Link>
              <Link className="btn btn-primary" to="/register">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
