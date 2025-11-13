import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { AccessControlPage } from './pages/AccessControlPage';
import { ChatPage } from './pages/ChatPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { NotificationProvider } from './notifications/NotificationProvider';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardPage />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="dashboard" element={<DashboardHomePage />} />
              <Route path="admin/access" element={<AccessControlPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
