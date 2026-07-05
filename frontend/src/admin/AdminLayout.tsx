import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <NavLink to="/admin" end>
          {t('admin.dashboard')}
        </NavLink>
        <NavLink to="/admin/lessons">{t('admin.lessons')}</NavLink>
        <NavLink to="/admin/quizzes">{t('admin.quizzes')}</NavLink>
        <NavLink to="/admin/import-export">{t('admin.importExport')}</NavLink>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
