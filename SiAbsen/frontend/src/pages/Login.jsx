import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { landingPath } from '../lib/roles.js';
import { ApiError } from '../lib/api.js';
import Loader from '../components/Loader.jsx';
import HealthBadge from '../components/HealthBadge.jsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Jangan arahkan sebelum sesi awal selesai dimuat.
  if (loading) return <Loader />;

  // Sudah login: arahkan menjauh dari halaman login.
  if (user) {
    const dari = location.state?.from?.pathname;
    return <RedirectAway to={dari || landingPath(user)} />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(username.trim(), password);
      const dari = location.state?.from?.pathname;
      navigate(dari || landingPath(loggedIn), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError('Username atau password salah');
      } else {
        setError(err?.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <main className="auth-card" aria-labelledby="judul-login">
        <h1 id="judul-login">SiAbsen</h1>
        <p className="subtitle">Masuk untuk melanjutkan</p>

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username / NIS</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-error" role="alert" aria-live="assertive">
            {error}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <footer className="auth-footer">
          <HealthBadge />
        </footer>
      </main>
    </div>
  );
}

// Komponen kecil agar navigasi dilakukan secara deklaratif saat render.
function RedirectAway({ to }) {
  return <Navigate to={to} replace />;
}
