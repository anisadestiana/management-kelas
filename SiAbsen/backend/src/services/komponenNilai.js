// src/services/komponenNilai.js — Logika bisnis komponen nilai & bobot (PRD §2.2: Guru).
//
// Skema (0001_init.sql): komponen_nilai(kelas_mapel_id -> kelas_mapel
// ON DELETE CASCADE, nama, bobot numeric(5,2), urutan int default 0).
// Tahap ini TIDAK memaksa total bobot = 100; respons list menyertakan
// total_bobot agar frontend bisa menampilkan peringatan bila perlu.
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/**
 * Daftar komponen nilai untuk satu kelas_mapel, diurutkan (urutan, lalu nama).
 * kelas_mapel_id wajib di sini agar daftar selalu dalam konteks satu penugasan.
 */
export async function list({ kelas_mapel_id }) {
  if (!kelas_mapel_id) {
    throw new AppError('VALIDATION_ERROR', 'kelas_mapel_id wajib diisi', 400);
  }
  await assertKelasMapelExists(kelas_mapel_id);

  const items = await sql`
    SELECT id, kelas_mapel_id, nama, bobot, urutan, created_at, updated_at
    FROM komponen_nilai
    WHERE kelas_mapel_id = ${kelas_mapel_id}
    ORDER BY urutan ASC, nama ASC
  `;

  // total_bobot dihitung di JS (bobot bisa null-safe) untuk konteks guru.
  const total_bobot = items.reduce((sum, k) => sum + Number(k.bobot || 0), 0);
  return { items, total_bobot };
}

/** Ambil satu komponen berdasarkan id, atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, kelas_mapel_id, nama, bobot, urutan, created_at, updated_at
    FROM komponen_nilai WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Komponen nilai tidak ditemukan', 404);
  }
  return row;
}

async function assertKelasMapelExists(kelasMapelId) {
  const rows = await sql`SELECT id FROM kelas_mapel WHERE id = ${kelasMapelId}`;
  if (rows.length === 0) {
    throw new AppError('KELAS_MAPEL_TIDAK_DITEMUKAN', 'Penugasan kelas-mapel tidak ditemukan', 400);
  }
}

/** Buat komponen nilai baru. */
export async function create(data) {
  const { kelas_mapel_id, nama, bobot, urutan = 0 } = data;
  await assertKelasMapelExists(kelas_mapel_id);

  const rows = await sql`
    INSERT INTO komponen_nilai (kelas_mapel_id, nama, bobot, urutan)
    VALUES (${kelas_mapel_id}, ${nama}, ${bobot}, ${urutan})
    RETURNING id, kelas_mapel_id, nama, bobot, urutan, created_at, updated_at
  `;
  return rows[0];
}

/** Perbarui sebagian field komponen nilai (nama/bobot/urutan). */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila tidak ada

  const next = {
    nama: data.nama ?? existing.nama,
    bobot: data.bobot ?? existing.bobot,
    urutan: data.urutan ?? existing.urutan,
  };

  const rows = await sql`
    UPDATE komponen_nilai SET
      nama = ${next.nama},
      bobot = ${next.bobot},
      urutan = ${next.urutan},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, kelas_mapel_id, nama, bobot, urutan, created_at, updated_at
  `;
  return rows[0];
}

/** Hapus komponen nilai. PERINGATAN: cascade menghapus penilaian & nilai. */
export async function remove(id) {
  const rows = await sql`DELETE FROM komponen_nilai WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Komponen nilai tidak ditemukan', 404);
  }
}
