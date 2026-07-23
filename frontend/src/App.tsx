import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/public/HomePage';
import QuizListPage from './pages/public/QuizListPage';
import QuizDetailPage from './pages/public/QuizDetailPage';
import PlayQuizPage from './pages/public/PlayQuizPage';
import ResultPage from './pages/public/ResultPage';
import LeaderboardPage from './pages/public/LeaderboardPage';

import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import QuizManagementPage from './pages/admin/QuizManagementPage';
import QuizEditorPage from './pages/admin/QuizEditorPage';
import StatisticsPage from './pages/admin/StatisticsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quizzes" element={<QuizListPage />} />
          <Route path="/quizzes/:id" element={<QuizDetailPage />} />
          <Route path="/result/:attemptId" element={<ResultPage />} />
          <Route path="/leaderboard/:quizId" element={<LeaderboardPage />} />
        </Route>

        {/* Play is full-screen (no public chrome) */}
        <Route path="/play/:id" element={<PlayQuizPage />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="quizzes" element={<QuizManagementPage />} />
          <Route path="quizzes/:id" element={<QuizEditorPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
