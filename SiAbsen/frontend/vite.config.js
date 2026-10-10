import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api ke backend saat development agar frontend memanggil endpoint
// backend (termasuk auth) tanpa masalah CORS/origin, dan cookie httpOnly
// `token` ikut mengalir secara otomatis (same-origin dari sisi browser).
//
// CATATAN PORT: backend secara default berjalan di 3001, TAPI shell user
// menyetel PORT=3011 sehingga backend sebenarnya listen di 3011
// (lihat log "SiAbsen backend berjalan di http://localhost:XXXX").
// Karena itu target proxy default = 3011. Jika backend Anda listen di port
// lain, override lewat env var VITE_API_TARGET (mis. http://localhost:3001).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3011';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
