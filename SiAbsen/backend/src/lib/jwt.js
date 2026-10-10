// src/lib/jwt.js — Penandatanganan dan verifikasi JWT.
//
// Payload HANYA berisi { id }. Role dan status (is_active) selalu dibaca ulang
// dari database di requireAuth, tidak pernah dipercaya dari isi token.
import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum diatur');
  }
  return secret;
}

export function signToken({ id }) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, getSecret(), { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
