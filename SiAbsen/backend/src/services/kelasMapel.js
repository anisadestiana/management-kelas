// src/services/kelasMapel.js — Logika bisnis penugasan Kelas-Mapel (PRD §2.2: Guru).
//
// Skema (0001_init.sql): kelas_mapel(kelas_id -> kelas, mapel_id -> mapel,
// keduanya ON DELETE CASCADE), UNIQUE (kelas_id, mapel_id).
// Tabel pivot: hanya assign (create) & unassign (remove); tidak ada update.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/**
 * Daftar penugasan kelas-mapel, dengan filter opsional per kelas/mapel.
 * Menyertakan nama kelas & mapel untuk konteks.
 */
export async function list({ kelas_id, mapel_id } = {}) {
  if (kelas_id && mapel_id) {
    return sql`
      SELECT km.id, km.kelas_id, km.mapel_id, km.created_at, km.updated_at,
             k.nama AS kelas_nama, m.nama AS mapel_nama, m.kode AS mapel_kode
      FROM kelas_mapel km
      JOIN kelas k ON k.id = km.kelas_id
      JOIN mapel m ON m.id = km.mapel_id
      WHERE km.kelas_id = ${kelas_id} AND km.mapel_id = ${mapel_id}
      ORDER BY km.created_at DESC
    `;
  }
  if (kelas_id) {
    return sql`
      SELECT km.id, km.kelas_id, km.mapel_id, km.created_at, km.updated_at,
             k.nama AS kelas_nama, m.nama AS mapel_nama, m.kode AS mapel_kode
      FROM kelas_mapel km
      JOIN kelas k ON k.id = km.kelas_id
      JOIN mapel m ON m.id = km.mapel_id
      WHERE km.kelas_id = ${kelas_id}
      ORDER BY km.created_at DESC
    `;
  }
  if (mapel_id) {
    return sql`
      SELECT km.id, km.kelas_id, km.mapel_id, km.created_at, km.updated_at,
             k.nama AS kelas_nama, m.nama AS mapel_nama, m.kode AS mapel_kode
      FROM kelas_mapel km
      JOIN kelas k ON k.id = km.kelas_id
      JOIN mapel m ON m.id = km.mapel_id
      WHERE km.mapel_id = ${mapel_id}
      ORDER BY km.created_at DESC
    `;
  }
  return sql`
    SELECT km.id, km.kelas_id, km.mapel_id, km.created_at, km.updated_at,
           k.nama AS kelas_nama, m.nama AS mapel_nama, m.kode AS mapel_kode
    FROM kelas_mapel km
    JOIN kelas k ON k.id = km.kelas_id
    JOIN mapel m ON m.id = km.mapel_id
    ORDER BY km.created_at DESC
  `;
}

/** Ambil satu penugasan berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT km.id, km.kelas_id, km.mapel_id, km.created_at, km.updated_at,
           k.nama AS kelas_nama, m.nama AS mapel_nama, m.kode AS mapel_kode
    FROM kelas_mapel km
    JOIN kelas k ON k.id = km.kelas_id
    JOIN mapel m ON m.id = km.mapel_id
    WHERE km.id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Penugasan tidak ditemukan', 404);
  }
  return row;
}

async function assertKelasExists(kelasId) {
  const rows = await sql`SELECT id FROM kelas WHERE id = ${kelasId}`;
  if (rows.length === 0) {
    throw new AppError('KELAS_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan', 400);
  }
}

async function assertMapelExists(mapelId) {
  const rows = await sql`SELECT id FROM mapel WHERE id = ${mapelId}`;
  if (rows.length === 0) {
    throw new AppError('MAPEL_TIDAK_DITEMUKAN', 'Mapel tidak ditemukan', 400);
  }
}

async function assertBelumDitugaskan(kelasId, mapelId) {
  const rows = await sql`
    SELECT id FROM kelas_mapel WHERE kelas_id = ${kelasId} AND mapel_id = ${mapelId}
  `;
  if (rows.length > 0) {
    throw new AppError('KONFLIK', 'Mapel sudah ditugaskan pada kelas ini', 409);
  }
}

/** Tugaskan (assign) mapel ke kelas. */
export async function create(data) {
  const { kelas_id, mapel_id } = data;
  await assertKelasExists(kelas_id);
  await assertMapelExists(mapel_id);
  await assertBelumDitugaskan(kelas_id, mapel_id);

  const rows = await sql`
    INSERT INTO kelas_mapel (kelas_id, mapel_id)
    VALUES (${kelas_id}, ${mapel_id})
    RETURNING id
  `;
  return getById(rows[0].id);
}

/** Batalkan penugasan (unassign). PERINGATAN: cascade ke komponen_nilai, sesi, dst. */
export async function remove(id) {
  const rows = await sql`DELETE FROM kelas_mapel WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Penugasan tidak ditemukan', 404);
  }
}
