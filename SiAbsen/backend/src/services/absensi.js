// src/services/absensi.js — Logika bisnis Input Absensi (PRD §2.2: Guru).
//
// Skema (0001_init.sql): absensi(sesi_id -> sesi_pertemuan, siswa_id -> users,
// status absensi_status NOT NULL, catatan, sumber absensi_sumber DEFAULT 'manual',
// UNIQUE (sesi_id, siswa_id)).
//
// Input manual guru selalu di-set sumber='manual'. Upsert best-effort per baris
// (konsisten dengan input nilai); driver Neon HTTP tidak memudahkan transaksi.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

async function assertSesiExists(sesiId) {
  const rows = await sql`SELECT id FROM sesi_pertemuan WHERE id = ${sesiId}`;
  if (rows.length === 0) {
    throw new AppError('SESI_TIDAK_DITEMUKAN', 'Sesi pertemuan tidak ditemukan', 400);
  }
}

/** Daftar absensi untuk satu sesi, join nama siswa. sesi_id wajib. */
export async function list({ sesi_id }) {
  if (!sesi_id) {
    throw new AppError('VALIDATION_ERROR', 'sesi_id wajib diisi', 400);
  }
  await assertSesiExists(sesi_id);

  return sql`
    SELECT a.id, a.sesi_id, a.siswa_id, a.status, a.catatan, a.sumber,
           a.created_at, a.updated_at,
           u.username AS nis, u.nama_lengkap AS siswa_nama
    FROM absensi a
    JOIN users u ON u.id = a.siswa_id
    WHERE a.sesi_id = ${sesi_id}
    ORDER BY u.nama_lengkap ASC
  `;
}

/** Pastikan user adalah siswa valid. */
async function isSiswa(siswaId) {
  const rows = await sql`SELECT id FROM users WHERE id = ${siswaId} AND role = 'siswa'`;
  return rows.length > 0;
}

/** Upsert satu baris absensi (sumber manual). */
async function upsertOne(sesiId, siswaId, status, catatan) {
  await sql`
    INSERT INTO absensi (sesi_id, siswa_id, status, catatan, sumber)
    VALUES (${sesiId}, ${siswaId}, ${status}, ${catatan}, 'manual')
    ON CONFLICT (sesi_id, siswa_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      catatan = EXCLUDED.catatan,
      sumber = 'manual',
      updated_at = now()
  `;
}

/**
 * Bulk upsert absensi untuk satu sesi. Best-effort per baris.
 * Mengembalikan ringkasan { total, berhasil, gagal, detail_gagal[] }.
 */
export async function upsert(sesiId, items) {
  await assertSesiExists(sesiId);

  const detailGagal = [];
  let berhasil = 0;

  for (let i = 0; i < items.length; i += 1) {
    const { siswa_id, status, catatan = null } = items[i];
    try {
      const ok = await isSiswa(siswa_id);
      if (!ok) {
        detailGagal.push({ index: i, siswa_id, alasan: 'Siswa tidak ditemukan' });
        continue;
      }
      await upsertOne(sesiId, siswa_id, status, catatan);
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
