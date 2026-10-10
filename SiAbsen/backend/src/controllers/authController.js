// src/controllers/authController.js — Controller endpoint auth.
import * as authService from '../services/authService.js';
import { signToken } from '../lib/jwt.js';
import { COOKIE_NAME, cookieOptions } from '../lib/cookie.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.js';
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

// Bungkus handler async agar error terlempar sampai ke next(err).
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Input tidak valid',
      400,
      result.error.flatten().fieldErrors
    );
  }
  return result.data;
}

export const login = asyncHandler(async (req, res) => {
  const { username, password } = validate(loginSchema, req.body);
  const result = await authService.login(username, password);

  const token = signToken({ id: result.id });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  // Ambil data lengkap user untuk respons (TANPA password_hash)
  const rows = await sql`
    SELECT id, username, role, nama_lengkap, must_change_password
    FROM users WHERE id = ${result.id}
  `;
  const user = rows[0];

  res.json({ user });
});

export const logout = (req, res) => {
  // Hapus cookie dengan opsi yang sama (tanpa maxAge)
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'Berhasil keluar' });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = validate(changePasswordSchema, req.body);
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  res.json({ message: 'Password berhasil diubah' });
});
