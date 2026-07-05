import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from './admin/AdminLayout';
import DashboardPage from './admin/DashboardPage';
import ImportExportPage from './admin/ImportExportPage';
import LessonEditorPage from './admin/LessonEditorPage';
import LessonsAdminPage from './admin/LessonsAdminPage';
import QuizEditorPage from './admin/QuizEditorPage';
import QuizzesAdminPage from './admin/QuizzesAdminPage';
import Layout from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/Protected';
import LessonDetailPage from './pages/LessonDetailPage';
import LessonsPage from './pages/LessonsPage';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import QuizPage from './pages/QuizPage';
import QuizzesPage from './pages/QuizzesPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/lessons" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/:id" element={<LessonDetailPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/quizzes/:id" element={<QuizPage />} />
        <Route
          path="/progress"
          element={
            <RequireAuth>
              <ProgressPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="lessons" element={<LessonsAdminPage />} />
          <Route path="lessons/:id" element={<LessonEditorPage />} />
          <Route path="quizzes" element={<QuizzesAdminPage />} />
          <Route path="quizzes/:id" element={<QuizEditorPage />} />
          <Route path="import-export" element={<ImportExportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/lessons" replace />} />
      </Route>
    </Routes>
  );
}
