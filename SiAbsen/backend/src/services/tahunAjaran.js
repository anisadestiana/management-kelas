// src/services/tahunAjaran.js — Logika bisnis CRUD Tahun Ajaran (PRD §2 Guru).
//
// Aturan penting dari skema (0001_init.sql):
// - Hanya SATU tahun ajaran boleh is_aktif = true (uq_tahun_ajaran_aktif,
//   partial unique index). Maka saat mengaktifkan satu baris, baris lain yang
//   aktif harus dinonaktifkan lebih dulu.
// - DELETE akan cascade ke kelas → kelas_mapel → dst (ON DELETE CASCADE).
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Daftar semua tahun ajaran, terbaru dibuat lebih dulu. */
export async function list() {
  return sql`
    SELECT id, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, created_at, updated_at
    FROM tahun_ajaran
    ORDER BY created_at DESC
  `;
}

/** Ambil satu tahun ajaran berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, created_at, updated_at
    FROM tahun_ajaran WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Tahun ajaran tidak ditemukan', 404);
  }
  return row;
}

/** Nonaktifkan semua tahun ajaran lain agar hanya satu yang aktif. */
async function deactivateOthers(exceptId) {
  if (exceptId) {
    await sql`UPDATE tahun_ajaran SET is_aktif = false, updated_at = now() WHERE is_aktif = true AND id <> ${exceptId}`;
  } else {
    await sql`UPDATE tahun_ajaran SET is_aktif = false, updated_at = now() WHERE is_aktif = true`;
  }
}

/** Buat tahun ajaran baru. Jika is_aktif true, baris aktif lain dinonaktifkan. */
export async function create(data) {
  const {
    nama,
    semester,
    tanggal_mulai = null,
    tanggal_selesai = null,
    is_aktif = false,
  } = data;

  if (is_aktif) {
    await deactivateOthers(null);
  }

  const rows = await sql`
    INSERT INTO tahun_ajaran (nama, semester, tanggal_mulai, tanggal_selesai, is_aktif)
    VALUES (${nama}, ${semester}, ${tanggal_mulai}, ${tanggal_selesai}, ${is_aktif})
    RETURNING id, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Perbarui sebagian field tahun ajaran.
 * Nilai akhir dihitung di JS dari baris yang ada agar aman: field yang tidak
 * dikirim (undefined) dipertahankan, sementara null yang eksplisit dihormati
 * untuk kolom tanggal (mengosongkan tanggal).
 */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  if (data.is_aktif === true) {
    await deactivateOthers(id);
  }

  const next = {
    nama: data.nama ?? existing.nama,
    semester: data.semester ?? existing.semester,
    tanggal_mulai:
      data.tanggal_mulai === undefined ? existing.tanggal_mulai : data.tanggal_mulai,
    tanggal_selesai:
      data.tanggal_selesai === undefined ? existing.tanggal_selesai : data.tanggal_selesai,
    is_aktif: data.is_aktif ?? existing.is_aktif,
  };

  const rows = await sql`
    UPDATE tahun_ajaran SET
      nama = ${next.nama},
      semester = ${next.semester},
      tanggal_mulai = ${next.tanggal_mulai},
      tanggal_selesai = ${next.tanggal_selesai},
      is_aktif = ${next.is_aktif},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Hapus tahun ajaran. PERINGATAN: cascade menghapus kelas & data turunannya.
 */
export async function remove(id) {
  const rows = await sql`DELETE FROM tahun_ajaran WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Tahun ajaran tidak ditemukan', 404);
  }
}
