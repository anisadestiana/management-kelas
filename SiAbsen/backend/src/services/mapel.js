// src/services/mapel.js — Logika bisnis CRUD Mapel (PRD §2.2: Guru).
//
// Skema (0001_init.sql): mapel(nama wajib, kode opsional). Tidak ada constraint
// unik di DB; untuk kenyamanan guru kita cegah nama duplikat (case-insensitive).
// DELETE akan cascade ke kelas_mapel (penugasan) dan turunannya.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Daftar semua mapel, terbaru dibuat lebih dulu. */
export async function list() {
  return sql`
    SELECT id, nama, kode, created_at, updated_at
    FROM mapel
    ORDER BY created_at DESC
  `;
}

/** Ambil satu mapel berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, nama, kode, created_at, updated_at
    FROM mapel WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Mapel tidak ditemukan', 404);
  }
  return row;
}

/** Cegah nama mapel duplikat (case-insensitive). exceptId untuk update. */
async function assertNamaUnik(nama, exceptId) {
  const rows = exceptId
    ? await sql`SELECT id FROM mapel WHERE lower(nama) = lower(${nama}) AND id <> ${exceptId}`
    : await sql`SELECT id FROM mapel WHERE lower(nama) = lower(${nama})`;
  if (rows.length > 0) {
    throw new AppError('KONFLIK', 'Nama mapel sudah ada', 409);
  }
}

/** Buat mapel baru. */
export async function create(data) {
  const { nama, kode = null } = data;
  await assertNamaUnik(nama, null);

  const rows = await sql`
    INSERT INTO mapel (nama, kode)
    VALUES (${nama}, ${kode})
    RETURNING id, nama, kode, created_at, updated_at
  `;
  return rows[0];
}

/** Perbarui sebagian field mapel. */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  const next = {
    nama: data.nama ?? existing.nama,
    kode: data.kode === undefined ? existing.kode : data.kode,
  };

  if (data.nama !== undefined) {
    await assertNamaUnik(next.nama, id);
  }

  const rows = await sql`
    UPDATE mapel SET
      nama = ${next.nama},
      kode = ${next.kode},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, nama, kode, created_at, updated_at
  `;
  return rows[0];
}

/** Hapus mapel. PERINGATAN: cascade menghapus penugasan kelas_mapel & turunannya. */
export async function remove(id) {
  const rows = await sql`DELETE FROM mapel WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Mapel tidak ditemukan', 404);
  }
}
