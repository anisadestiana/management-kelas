// src/services/kelas.js — Logika bisnis CRUD Kelas (PRD §2.2: Guru).
//
// Aturan dari skema (0001_init.sql):
// - kelas.tahun_ajaran_id -> tahun_ajaran(id) ON DELETE CASCADE (wajib ada).
// - UNIQUE (tahun_ajaran_id, nama): nama kelas unik dalam satu tahun ajaran.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Daftar semua kelas (join tahun ajaran untuk konteks), terbaru lebih dulu. */
export async function list() {
  return sql`
    SELECT
      k.id, k.tahun_ajaran_id, k.nama, k.created_at, k.updated_at,
      ta.nama AS tahun_ajaran_nama, ta.semester AS tahun_ajaran_semester
    FROM kelas k
    JOIN tahun_ajaran ta ON ta.id = k.tahun_ajaran_id
    ORDER BY k.created_at DESC
  `;
}

/** Ambil satu kelas berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT
      k.id, k.tahun_ajaran_id, k.nama, k.created_at, k.updated_at,
      ta.nama AS tahun_ajaran_nama, ta.semester AS tahun_ajaran_semester
    FROM kelas k
    JOIN tahun_ajaran ta ON ta.id = k.tahun_ajaran_id
    WHERE k.id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Kelas tidak ditemukan', 404);
  }
  return row;
}

/** Pastikan tahun ajaran ada, atau lempar 400 (referensi tidak valid). */
async function assertTahunAjaranExists(tahunAjaranId) {
  const rows = await sql`SELECT id FROM tahun_ajaran WHERE id = ${tahunAjaranId}`;
  if (rows.length === 0) {
    throw new AppError('TAHUN_AJARAN_TIDAK_DITEMUKAN', 'Tahun ajaran tidak ditemukan', 400);
  }
}

/** Pastikan nama unik dalam tahun ajaran, atau lempar 409. exceptId untuk update. */
async function assertNamaUnik(tahunAjaranId, nama, exceptId) {
  const rows = exceptId
    ? await sql`SELECT id FROM kelas WHERE tahun_ajaran_id = ${tahunAjaranId} AND nama = ${nama} AND id <> ${exceptId}`
    : await sql`SELECT id FROM kelas WHERE tahun_ajaran_id = ${tahunAjaranId} AND nama = ${nama}`;
  if (rows.length > 0) {
    throw new AppError('KONFLIK', 'Nama kelas sudah ada pada tahun ajaran ini', 409);
  }
}

/** Buat kelas baru. */
export async function create(data) {
  const { tahun_ajaran_id, nama } = data;
  await assertTahunAjaranExists(tahun_ajaran_id);
  await assertNamaUnik(tahun_ajaran_id, nama, null);

  const rows = await sql`
    INSERT INTO kelas (tahun_ajaran_id, nama)
    VALUES (${tahun_ajaran_id}, ${nama})
    RETURNING id
  `;
  return getById(rows[0].id);
}

/** Perbarui sebagian field kelas. */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  const next = {
    tahun_ajaran_id: data.tahun_ajaran_id ?? existing.tahun_ajaran_id,
    nama: data.nama ?? existing.nama,
  };

  if (data.tahun_ajaran_id !== undefined) {
    await assertTahunAjaranExists(next.tahun_ajaran_id);
  }
  await assertNamaUnik(next.tahun_ajaran_id, next.nama, id);

  await sql`
    UPDATE kelas SET
      tahun_ajaran_id = ${next.tahun_ajaran_id},
      nama = ${next.nama},
      updated_at = now()
    WHERE id = ${id}
  `;
  return getById(id);
}

/** Hapus kelas. PERINGATAN: cascade menghapus kelas_mapel, siswa_kelas, dst. */
export async function remove(id) {
  const rows = await sql`DELETE FROM kelas WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Kelas tidak ditemukan', 404);
  }
}
