import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DataProvider } from './data/DataProvider';
import { useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { FocusPage } from './features/focus/FocusPage';
import { TimerProvider } from './features/focus/TimerProvider';
import { GoalsPage } from './features/goals/GoalsPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { TasksPage } from './features/tasks/TasksPage';
import { isConfigured } from './lib/supabase';

function ConfigMissing() {
  return (
    <main className="center-screen">
      <div className="error-box">
        <h1>Thiếu cấu hình</h1>
        <p className="page-sub">
          Ứng dụng chưa có thông tin kết nối Supabase. Thêm hai biến môi trường rồi build lại:
        </p>
        <p>
          <code>VITE_SUPABASE_URL</code>
        </p>
        <p>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
        </p>
      </div>
    </main>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (!isConfigured) return <ConfigMissing />;

  if (loading) {
    return (
      <div className="center-screen">
        <p className="loading">Đang tải…</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <DataProvider key={session.user.id}>
      <TimerProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="focus" element={<FocusPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TimerProvider>
    </DataProvider>
  );
}
