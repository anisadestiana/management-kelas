import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { landingPath } from '../lib/roles.js';

// Hanya mengizinkan peran yang cocok. Jika peran tidak cocok (mis. siswa
// mencoba membuka /guru), arahkan ke landing miliknya sendiri.
export default function RoleRoute({ role }) {
  const { user } = useAuth();

  if (user && user.role !== role) {
    return <Navigate to={landingPath(user)} replace />;
  }
  return <Outlet />;
}
