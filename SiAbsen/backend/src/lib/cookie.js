// src/lib/cookie.js — Konfigurasi cookie untuk token auth.

export const COOKIE_NAME = 'token';

// Masa berlaku cookie: SENGAJA dipaku 7 hari, independen dari JWT_EXPIRES_IN.
// Jika JWT kedaluwarsa lebih dulu namun cookie masih ada, requireAuth akan
// memverifikasi token dan menolak dengan 401 TOKEN_INVALID (lihat middleware/auth.js).
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // Secure hanya aktif di production (butuh HTTPS)
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  };
}
