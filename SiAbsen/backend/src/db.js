import { neon } from '@neondatabase/serverless';

/**
 * Koneksi ke Neon PostgreSQL.
 *
 * Menggunakan driver @neondatabase/serverless yang cocok untuk lingkungan
 * serverless (mis. Vercel Function). Gunakan connection string "pooled"
 * (host mengandung "-pooler") pada DATABASE_URL.
 *
 * Koneksi bersifat opsional pada tahap skeleton ini: jika DATABASE_URL belum
 * diisi, aplikasi tetap berjalan dan endpoint /api/health tetap mengembalikan OK.
 */
const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? neon(connectionString) : null;

export const isDbConfigured = Boolean(connectionString);

/**
 * Cek konektivitas database. Mengembalikan true jika query sederhana berhasil.
 * Jika DATABASE_URL belum diatur, mengembalikan false tanpa melempar error.
 */
export async function checkDbConnection() {
  if (!sql) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
