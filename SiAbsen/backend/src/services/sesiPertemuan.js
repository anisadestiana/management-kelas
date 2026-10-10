// src/services/sesiPertemuan.js — Logika bisnis Sesi Pertemuan (PRD §2.2: Guru).
//
// Skema (0001_init.sql): sesi_pertemuan(kelas_mapel_id -> kelas_mapel CASCADE,
// tanggal NOT NULL, pertemuan_ke NOT NULL, topik,
// UNIQUE (kelas_mapel_id, tanggal, pertemuan_ke)).
// DELETE cascade menghapus baris absensi terkait.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Daftar sesi untuk satu kelas_mapel, terbaru (tanggal, pertemuan) dulu. */
export async function list({ kelas_mapel_id }) {
  if (!kelas_mapel_id) {
    throw new AppError('VALIDATION_ERROR', 'kelas_mapel_id wajib diisi', 400);
  }
  await assertKelasMapelExists(kelas_mapel_id);

  return sql`
    SELECT id, kelas_mapel_id, tanggal, pertemuan_ke, topik, created_at, updated_at
    FROM sesi_pertemuan
    WHERE kelas_mapel_id = ${kelas_mapel_id}
    ORDER BY tanggal DESC, pertemuan_ke DESC
  `;
}

/** Ambil satu sesi berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, kelas_mapel_id, tanggal, pertemuan_ke, topik, created_at, updated_at
    FROM sesi_pertemuan WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Sesi pertemuan tidak ditemukan', 404);
  }
  return row;
}

async function assertKelasMapelExists(kelasMapelId) {
  const rows = await sql`SELECT id FROM kelas_mapel WHERE id = ${kelasMapelId}`;
  if (rows.length === 0) {
    throw new AppError('KELAS_MAPEL_TIDAK_DITEMUKAN', 'Penugasan kelas-mapel tidak ditemukan', 400);
  }
}

/** Pastikan kombinasi (kelas_mapel, tanggal, pertemuan_ke) unik. exceptId untuk update. */
async function assertSesiUnik(kelasMapelId, tanggal, pertemuanKe, exceptId) {
  const rows = exceptId
    ? await sql`
        SELECT id FROM sesi_pertemuan
        WHERE kelas_mapel_id = ${kelasMapelId} AND tanggal = ${tanggal}
          AND pertemuan_ke = ${pertemuanKe} AND id <> ${exceptId}
      `
    : await sql`
        SELECT id FROM sesi_pertemuan
        WHERE kelas_mapel_id = ${kelasMapelId} AND tanggal = ${tanggal}
          AND pertemuan_ke = ${pertemuanKe}
      `;
  if (rows.length > 0) {
    throw new AppError('KONFLIK', 'Sesi dengan tanggal & pertemuan ini sudah ada', 409);
  }
}

/** Buat sesi pertemuan baru. */
export async function create(data) {
  const { kelas_mapel_id, tanggal, pertemuan_ke, topik = null } = data;
  await assertKelasMapelExists(kelas_mapel_id);
  await assertSesiUnik(kelas_mapel_id, tanggal, pertemuan_ke, null);

  const rows = await sql`
    INSERT INTO sesi_pertemuan (kelas_mapel_id, tanggal, pertemuan_ke, topik)
    VALUES (${kelas_mapel_id}, ${tanggal}, ${pertemuan_ke}, ${topik})
    RETURNING id, kelas_mapel_id, tanggal, pertemuan_ke, topik, created_at, updated_at
  `;
  return rows[0];
}

/** Perbarui sebagian field sesi (tanggal/pertemuan_ke/topik). */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  const next = {
    tanggal: data.tanggal ?? existing.tanggal,
    pertemuan_ke: data.pertemuan_ke ?? existing.pertemuan_ke,
    topik: data.topik === undefined ? existing.topik : data.topik,
  };

  // Cek unik hanya bila tanggal/pertemuan berubah.
  if (data.tanggal !== undefined || data.pertemuan_ke !== undefined) {
    await assertSesiUnik(existing.kelas_mapel_id, next.tanggal, next.pertemuan_ke, id);
  }

  const rows = await sql`
    UPDATE sesi_pertemuan SET
      tanggal = ${next.tanggal},
      pertemuan_ke = ${next.pertemuan_ke},
      topik = ${next.topik},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, kelas_mapel_id, tanggal, pertemuan_ke, topik, created_at, updated_at
  `;
  return rows[0];
}

/** Hapus sesi. PERINGATAN: cascade menghapus baris absensi terkait. */
export async function remove(id) {
  const rows = await sql`DELETE FROM sesi_pertemuan WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Sesi pertemuan tidak ditemukan', 404);
  }
}
