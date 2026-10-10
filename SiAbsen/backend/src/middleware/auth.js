// src/middleware/auth.js — Middleware autentikasi dan otorisasi.
//
// Catatan M0: must_change_password HANYA di-surface pada respons login dan
// /api/auth/me. requireAuth TIDAK memblokir endpoint apa pun untuk user yang
// berflag (penegakan ditunda ke milestone yang menambah endpoint tersebut;
// frontend yang melakukan redirect berdasarkan flag) [finding 4].
import { verifyToken } from '../lib/jwt.js';
import { COOKIE_NAME } from '../lib/cookie.js';
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : undefined;
    if (!token) {
      throw new AppError('UNAUTHENTICATED', 'Anda belum masuk', 401);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      // Termasuk token kedaluwarsa / rusak
      throw new AppError('TOKEN_INVALID', 'Sesi tidak valid', 401);
    }

    // id SELALU diambil dari token, tidak pernah dari parameter klien
    const rows = await sql`
      SELECT id, username, role, nama_lengkap, must_change_password, is_active
      FROM users WHERE id = ${payload.id}
    `;
    const user = rows[0];
    if (!user || user.is_active === false) {
      throw new AppError('UNAUTHENTICATED', 'Anda belum masuk', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'Akses ditolak', 403));
    }
    next();
  };
}
