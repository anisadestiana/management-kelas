// src/routes/auth.js — Router autentikasi.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

// Catatan proxy [finding 6]: di lingkungan deploy (di belakang reverse proxy /
// load balancer) WAJIB mengatur app.set('trust proxy', ...) agar req.ip benar,
// sehingga bagian IP pada kunci rate-limit bermakna. Tidak diperlukan untuk M0 lokal.
//
// Catatan versi: express-rate-limit 7.5.1 yang terpasang TIDAK mengekspor helper
// `ipKeyGenerator`. Untuk tetap memenuhi maksud finding 6 (kunci = IP + username,
// IP dinormalisasi agar IPv6 tidak mudah di-bypass), kita normalisasi IP di sini:
// IPv4-mapped IPv6 (::ffff:a.b.c.d) direduksi ke IPv4, dan IPv6 dipotong ke /64.
function normalizeIp(ip) {
  if (!ip) return 'unknown';
  // IPv4-mapped IPv6 -> IPv4
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  // IPv6 -> ambil 4 hextet pertama (prefix /64)
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::/64';
  }
  return ip;
}

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = String(req.body?.username || '').toLowerCase();
    return `${normalizeIp(req.ip)}|${username}`;
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan login. Coba lagi sebentar.',
      },
    });
  },
});

const router = Router();

router.post('/auth/login', loginLimiter, authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.me);
router.post('/auth/change-password', requireAuth, authController.changePassword);

export default router;
