import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AdminLayout from './layouts/AdminLayout';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Reports from './pages/Reports';
import RequestDetails from './pages/RequestDetails';
import Requests from './pages/Requests';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Workers from './pages/Workers';

function ProtectedRoute() {
  const { loading, user, profile } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingSpinner fullScreen label={t('auth.checkingAccess')} />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { loading, profile } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingSpinner fullScreen label={t('auth.checkingAccess')} />;
  }

  if (profile) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/requests/:id" element={<RequestDetails />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
