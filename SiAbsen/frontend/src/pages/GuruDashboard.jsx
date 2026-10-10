import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Placeholder landing untuk peran guru.
export default function GuruDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <h1>Dashboard Guru — {user?.nama_lengkap}</h1>
        <button type="button" className="btn-secondary" onClick={onLogout}>
          Keluar
        </button>
      </header>
      <p className="landing-body">
        Selamat datang. Fitur dashboard guru akan ditambahkan pada tahap berikutnya.
      </p>
    </div>
  );
}
