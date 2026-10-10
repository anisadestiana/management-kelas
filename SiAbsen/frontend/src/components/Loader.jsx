// Loader layar penuh, dipakai saat GET /api/auth/me awal sedang berjalan
// agar halaman login tidak sempat berkedip.
export default function Loader({ text = 'Memuat...' }) {
  return (
    <div className="loader-screen" role="status" aria-live="polite">
      <span className="status-badge loading">
        <span className="dot" /> {text}
      </span>
    </div>
  );
}
