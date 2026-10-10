import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import Loader from './components/Loader.jsx';
import Login from './pages/Login.jsx';
import GuruDashboard from './pages/GuruDashboard.jsx';
import SiswaBeranda from './pages/SiswaBeranda.jsx';
import { landingPath } from './lib/roles.js';

// Index "/": arahkan ke landing sesuai peran jika sudah login, selain itu /login.
function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return <Navigate to={user ? landingPath(user) : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="guru" />}>
            <Route path="/guru" element={<GuruDashboard />} />
          </Route>
          <Route element={<RoleRoute role="siswa" />}>
            <Route path="/siswa" element={<SiswaBeranda />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
