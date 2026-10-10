// src/services/nilai.js — Logika bisnis Input Nilai (PRD §2.2: Guru).
//
// Skema (0001_init.sql): nilai(penilaian_id -> penilaian, siswa_id -> users,
// skor numeric(5,2), UNIQUE (penilaian_id, siswa_id),
// CHECK (skor IS NULL OR 0..100)).
//
// upsert bersifat best-effort per baris (konsisten dengan impor CSV): baris
// valid di-upsert, baris gagal (siswa bukan siswa / tidak ada) dilaporkan.
// Driver Neon HTTP tidak memudahkan transaksi multi-statement, jadi tidak atomik.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

async function assertPenilaianExists(penilaianId) {
  const rows = await sql`SELECT id FROM penilaian WHERE id = ${penilaianId}`;
  if (rows.length === 0) {
    throw new AppError('PENILAIAN_TIDAK_DITEMUKAN', 'Penilaian tidak ditemukan', 400);
  }
}

/**
 * Daftar nilai untuk satu penilaian, join nama siswa. penilaian_id wajib agar
 * daftar selalu dalam konteks satu penilaian.
 */
export async function list({ penilaian_id }) {
  if (!penilaian_id) {
    throw new AppError('VALIDATION_ERROR', 'penilaian_id wajib diisi', 400);
  }
  await assertPenilaianExists(penilaian_id);

  return sql`
    SELECT n.id, n.penilaian_id, n.siswa_id, n.skor, n.created_at, n.updated_at,
           u.username AS nis, u.nama_lengkap AS siswa_nama
    FROM nilai n
    JOIN users u ON u.id = n.siswa_id
    WHERE n.penilaian_id = ${penilaian_id}
    ORDER BY u.nama_lengkap ASC
  `;
}

/** Pastikan user adalah siswa yang valid. */
async function isSiswa(siswaId) {
  const rows = await sql`SELECT id FROM users WHERE id = ${siswaId} AND role = 'siswa'`;
  return rows.length > 0;
}

/** Upsert satu baris nilai (INSERT ... ON CONFLICT update skor). */
async function upsertOne(penilaianId, siswaId, skor) {
  await sql`
    INSERT INTO nilai (penilaian_id, siswa_id, skor)
    VALUES (${penilaianId}, ${siswaId}, ${skor})
    ON CONFLICT (penilaian_id, siswa_id)
    DO UPDATE SET skor = EXCLUDED.skor, updated_at = now()
  `;
}

/**
 * Bulk upsert nilai untuk satu penilaian. Best-effort per baris.
 * Mengembalikan ringkasan { total, berhasil, gagal, detail_gagal[] }.
 */
export async function upsert(penilaianId, items) {
  await assertPenilaianExists(penilaianId);

  const detailGagal = [];
  let berhasil = 0;

  for (let i = 0; i < items.length; i += 1) {
    const { siswa_id, skor } = items[i];
    try {
      const ok = await isSiswa(siswa_id);
      if (!ok) {
        detailGagal.push({ index: i, siswa_id, alasan: 'Siswa tidak ditemukan' });
        continue;
      }
      await upsertOne(penilaianId, siswa_id, skor);
      berhasil += 1;
    } catch (err) {
      const alasan = err instanceof AppError ? err.message : 'Gagal menyimpan';
      detailGagal.push({ index: i, siswa_id, alasan });
    }
  }

  return {
    total: items.length,
    berhasil,
    gagal: detailGagal.length,
    detail_gagal: detailGagal,
  };
}
