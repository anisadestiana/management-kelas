// src/services/penilaian.js — Logika bisnis Penilaian (PRD §2.2: Guru).
//
// Skema (0001_init.sql): penilaian(komponen_id -> komponen_nilai
// ON DELETE CASCADE, judul, tanggal date). Satu penilaian = satu "event"
// penilaian (mis. "Ulangan Bab 1") di bawah sebuah komponen nilai.
// DELETE cascade menghapus baris nilai terkait.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Daftar penilaian untuk satu komponen, terbaru (tanggal lalu created) dulu. */
export async function list({ komponen_id }) {
  if (!komponen_id) {
    throw new AppError('VALIDATION_ERROR', 'komponen_id wajib diisi', 400);
  }
  await assertKomponenExists(komponen_id);

  return sql`
    SELECT id, komponen_id, judul, tanggal, created_at, updated_at
    FROM penilaian
    WHERE komponen_id = ${komponen_id}
    ORDER BY tanggal DESC NULLS LAST, created_at DESC
  `;
}

/** Ambil satu penilaian berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, komponen_id, judul, tanggal, created_at, updated_at
    FROM penilaian WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Penilaian tidak ditemukan', 404);
  }
  return row;
}

async function assertKomponenExists(komponenId) {
  const rows = await sql`SELECT id FROM komponen_nilai WHERE id = ${komponenId}`;
  if (rows.length === 0) {
    throw new AppError('KOMPONEN_TIDAK_DITEMUKAN', 'Komponen nilai tidak ditemukan', 400);
  }
}

/** Buat penilaian baru. */
export async function create(data) {
  const { komponen_id, judul, tanggal = null } = data;
  await assertKomponenExists(komponen_id);

  const rows = await sql`
    INSERT INTO penilaian (komponen_id, judul, tanggal)
    VALUES (${komponen_id}, ${judul}, ${tanggal})
    RETURNING id, komponen_id, judul, tanggal, created_at, updated_at
  `;
  return rows[0];
}

/** Perbarui sebagian field penilaian (judul/tanggal). */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  const next = {
    judul: data.judul ?? existing.judul,
    tanggal: data.tanggal === undefined ? existing.tanggal : data.tanggal,
  };

  const rows = await sql`
    UPDATE penilaian SET
      judul = ${next.judul},
      tanggal = ${next.tanggal},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, komponen_id, judul, tanggal, created_at, updated_at
  `;
  return rows[0];
}

/** Hapus penilaian. PERINGATAN: cascade menghapus baris nilai terkait. */
export async function remove(id) {
  const rows = await sql`DELETE FROM penilaian WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Penilaian tidak ditemukan', 404);
  }
}
