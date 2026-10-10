// scripts/seed-guru.js — Upsert idempotent akun guru awal.
//
// Membuat/menyinkronkan satu akun guru dari GURU_SEED_USERNAME/GURU_SEED_PASSWORD.
// must_change_password = false (guru dibuat admin, AUTH-7). TIDAK pernah mencetak
// password maupun hash.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../src/lib/password.js';

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL_DIRECT atau DATABASE_URL belum diatur');
  process.exit(1);
}

const username = process.env.GURU_SEED_USERNAME;
const password = process.env.GURU_SEED_PASSWORD;

if (!username || !password) {
  console.error('GURU_SEED_USERNAME dan GURU_SEED_PASSWORD wajib diisi di .env');
  process.exit(1);
}

const nama = process.env.GURU_SEED_NAMA || username;

async function run() {
  const sql = neon(connectionString);
  const hash = await hashPassword(password);

  try {
    await sql`
      INSERT INTO users (username, password_hash, role, nama_lengkap, must_change_password, is_active)
      VALUES (${username}, ${hash}, 'guru', ${nama}, false, true)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'guru',
        nama_lengkap = EXCLUDED.nama_lengkap,
        must_change_password = false,
        is_active = true,
        updated_at = now()
    `;
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (/relation .*users.* does not exist|table .*users/i.test(message)) {
      console.error(
        'Tabel users belum ada. Jalankan "npm run migrate" terlebih dahulu, lalu ulangi seed.'
      );
    } else {
      console.error('Gagal melakukan seed guru:', message);
    }
    process.exit(1);
  }

  console.log(`Seed guru selesai untuk username: ${username}`);
  process.exit(0);
}

run();
