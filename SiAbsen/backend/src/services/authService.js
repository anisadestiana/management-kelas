// src/services/authService.js — Logika bisnis autentikasi.
import { verifyPassword, hashPassword } from '../lib/password.js';
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/**
 * Login dengan username + password.
 * Pesan error generik (tidak membedakan user tidak ada vs password salah)
 * untuk mencegah enumerasi akun.
 */
export async function login(username, password) {
  const rows = await sql`
    SELECT id, password_hash, role, must_change_password, is_active
    FROM users WHERE username = ${username}
  `;
  const user = rows[0];

  const invalid = () =>
    new AppError('BAD_CREDENTIALS', 'Username atau password salah', 401);

  if (!user || user.is_active === false) {
    throw invalid();
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    throw invalid();
  }

  return {
    id: user.id,
    role: user.role,
    must_change_password: user.must_change_password,
  };
}

/**
 * Ubah password (AUTH-3). Setelah berhasil, must_change_password = false.
 */
export async function changePassword(userId, oldPassword, newPassword) {
  const rows = await sql`
    SELECT password_hash FROM users WHERE id = ${userId}
  `;
  const user = rows[0];
  if (!user) {
    throw new AppError('BAD_CREDENTIALS', 'Password lama salah', 400);
  }

  const ok = await verifyPassword(oldPassword, user.password_hash);
  if (!ok) {
    throw new AppError('BAD_CREDENTIALS', 'Password lama salah', 400);
  }

  const hash = await hashPassword(newPassword);
  await sql`
    UPDATE users
    SET password_hash = ${hash}, must_change_password = false, updated_at = now()
    WHERE id = ${userId}
  `;
}
