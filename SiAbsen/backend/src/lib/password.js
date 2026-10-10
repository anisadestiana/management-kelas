// src/lib/password.js — Hashing dan verifikasi password.
//
// Modul tunggal untuk hashing agar bila perlu beralih ke bcryptjs cukup diubah di sini.
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
