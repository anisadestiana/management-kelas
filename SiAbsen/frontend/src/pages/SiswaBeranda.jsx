import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Placeholder landing untuk peran siswa.
export default function SiswaBeranda() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <h1>Beranda Siswa — {user?.nama_lengkap}</h1>
        <button type="button" className="btn-secondary" onClick={onLogout}>
          Keluar
        </button>
      </header>
      <p className="landing-body">
        Selamat datang. Fitur beranda siswa akan ditambahkan pada tahap berikutnya.
      </p>
    </div>
  );
}
