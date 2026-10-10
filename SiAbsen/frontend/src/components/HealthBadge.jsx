import { useCallback, useEffect, useState } from 'react';

// Indikator kecil status koneksi backend (memanggil GET /api/health).
// Dipertahankan dari App lama agar pengecekan kesehatan tetap ada,
// namun kini tampil tidak mengganggu di footer halaman login.
export default function HealthBadge() {
  const [state, setState] = useState('loading'); // 'loading' | 'ok' | 'error'

  const fetchHealth = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setState(json.status === 'OK' ? 'ok' : 'error');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const label =
    state === 'loading'
      ? 'Memeriksa server...'
      : state === 'ok'
        ? 'Server terhubung'
        : 'Server tidak terhubung';

  return (
    <span className={`health-badge ${state}`} title={label}>
      <span className="dot" /> {label}
    </span>
  );
}
