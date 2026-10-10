// src/services/siswa.js — Logika bisnis CRUD Siswa (PRD §2.2: Guru).
//
// Siswa = baris users dengan role='siswa'. Konvensi (lihat seed-data.js):
//   - username = NIS (unik di tabel users)
//   - must_change_password = true saat dibuat / direset
//   - penempatan kelas lewat siswa_kelas (UNIQUE (siswa_id, kelas_id))
// Respons TIDAK PERNAH menyertakan password_hash.
import { AppError } from '../lib/appError.js';
import { hashPassword } from '../lib/password.js';
import { parseCsv } from '../lib/csv.js';
import { sql } from '../db.js';

// Password default bila guru tidak menentukan (konsisten dengan seed-data.js).
const DEFAULT_PASSWORD = process.env.SISWA_SEED_PASSWORD || 'Siswa123!';

/**
 * Daftar siswa (role='siswa'), dengan kelas yang sedang ditempati (bila ada).
 * Filter opsional per kelas. Tidak mengembalikan password_hash.
 */
export async function list({ kelas_id } = {}) {
  if (kelas_id) {
    return sql`
      SELECT u.id, u.username AS nis, u.nama_lengkap, u.is_active,
             u.must_change_password, u.created_at, u.updated_at,
             sk.kelas_id, k.nama AS kelas_nama
      FROM users u
      JOIN siswa_kelas sk ON sk.siswa_id = u.id
      JOIN kelas k ON k.id = sk.kelas_id
      WHERE u.role = 'siswa' AND sk.kelas_id = ${kelas_id}
      ORDER BY u.nama_lengkap ASC
    `;
  }
  return sql`
    SELECT u.id, u.username AS nis, u.nama_lengkap, u.is_active,
           u.must_change_password, u.created_at, u.updated_at,
           sk.kelas_id, k.nama AS kelas_nama
    FROM users u
    LEFT JOIN siswa_kelas sk ON sk.siswa_id = u.id
    LEFT JOIN kelas k ON k.id = sk.kelas_id
    WHERE u.role = 'siswa'
    ORDER BY u.nama_lengkap ASC
  `;
}

/** Ambil satu siswa berdasarkan id, atau lempar 404. Tanpa password_hash. */
export async function getById(id) {
  const rows = await sql`
    SELECT u.id, u.username AS nis, u.nama_lengkap, u.is_active,
           u.must_change_password, u.created_at, u.updated_at,
           sk.kelas_id, k.nama AS kelas_nama
    FROM users u
    LEFT JOIN siswa_kelas sk ON sk.siswa_id = u.id
    LEFT JOIN kelas k ON k.id = sk.kelas_id
    WHERE u.id = ${id} AND u.role = 'siswa'
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Siswa tidak ditemukan', 404);
  }
  return row;
}

/** Pastikan NIS (username) belum dipakai. exceptId untuk update. */
async function assertNisUnik(nis, exceptId) {
  const rows = exceptId
    ? await sql`SELECT id FROM users WHERE username = ${nis} AND id <> ${exceptId}`
    : await sql`SELECT id FROM users WHERE username = ${nis}`;
  if (rows.length > 0) {
    throw new AppError('KONFLIK', 'NIS sudah digunakan', 409);
  }
}

/** Pastikan kelas ada, atau lempar 400. */
async function assertKelasExists(kelasId) {
  const rows = await sql`SELECT id FROM kelas WHERE id = ${kelasId}`;
  if (rows.length === 0) {
    throw new AppError('KELAS_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan', 400);
  }
}

/** Buat siswa baru (+ opsional tempatkan ke kelas). */
export async function create(data) {
  const { nis, nama_lengkap, password, kelas_id } = data;
  await assertNisUnik(nis, null);
  if (kelas_id) {
    await assertKelasExists(kelas_id);
  }

  const hash = await hashPassword(password || DEFAULT_PASSWORD);

  const rows = await sql`
    INSERT INTO users (username, password_hash, role, nama_lengkap, must_change_password, is_active)
    VALUES (${nis}, ${hash}, 'siswa', ${nama_lengkap}, true, true)
    RETURNING id
  `;
  const id = rows[0].id;

  if (kelas_id) {
    await sql`
      INSERT INTO siswa_kelas (siswa_id, kelas_id)
      VALUES (${id}, ${kelas_id})
      ON CONFLICT (siswa_id, kelas_id) DO NOTHING
    `;
  }

  return getById(id);
}

/** Perbarui data siswa (nis/nama/aktif). Tidak mengubah password di sini. */
export async function update(id, data) {
  const existing = await getById(id); // melempar 404 bila bukan siswa / tidak ada

  if (data.nis !== undefined) {
    await assertNisUnik(data.nis, id);
  }

  const next = {
    nis: data.nis ?? existing.nis,
    nama_lengkap: data.nama_lengkap ?? existing.nama_lengkap,
    is_active: data.is_active ?? existing.is_active,
  };

  await sql`
    UPDATE users SET
      username = ${next.nis},
      nama_lengkap = ${next.nama_lengkap},
      is_active = ${next.is_active},
      updated_at = now()
    WHERE id = ${id} AND role = 'siswa'
  `;
  return getById(id);
}

/**
 * Reset password siswa oleh guru (PRD §2.2). Set must_change_password = true.
 * Bila password tidak diberikan, pakai password default.
 */
export async function resetPassword(id, password) {
  await getById(id); // pastikan siswa ada
  const hash = await hashPassword(password || DEFAULT_PASSWORD);
  await sql`
    UPDATE users SET
      password_hash = ${hash},
      must_change_password = true,
      updated_at = now()
    WHERE id = ${id} AND role = 'siswa'
  `;
}

/** Hapus siswa. PERINGATAN: cascade menghapus nilai, absensi, siswa_kelas, dst. */
export async function remove(id) {
  const rows = await sql`DELETE FROM users WHERE id = ${id} AND role = 'siswa' RETURNING id`;
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Siswa tidak ditemukan', 404);
  }
}

/**
 * Impor banyak siswa dari teks CSV. Header wajib memuat kolom `nis` dan
 * `nama_lengkap`; kolom `kelas_id` opsional per baris. Bila baris tidak punya
 * kelas_id, dipakai defaultKelasId (dari body) bila ada.
 *
 * Bersifat best-effort per baris: baris valid dibuat, baris gagal dicatat
 * dengan nomor baris & alasan. Mengembalikan ringkasan hasil.
 */
export async function importCsv(csvText, defaultKelasId) {
  const { header, rows } = parseCsv(csvText);

  if (!header.includes('nis') || !header.includes('nama_lengkap')) {
    throw new AppError(
      'VALIDATION_ERROR',
      "Header CSV wajib memuat kolom 'nis' dan 'nama_lengkap'",
      400
    );
  }

  if (defaultKelasId) {
    await assertKelasExists(defaultKelasId);
  }

  const detailGagal = [];
  const detailBerhasil = [];

  for (const { data, lineNumber } of rows) {
    const nis = (data.nis || '').trim();
    const namaLengkap = (data.nama_lengkap || '').trim();
    const kelasId = (data.kelas_id || '').trim() || defaultKelasId || undefined;

    if (!nis || !namaLengkap) {
      detailGagal.push({ baris: lineNumber, nis, alasan: 'NIS dan nama lengkap wajib diisi' });
      continue;
    }

    try {
      const siswa = await create({ nis, nama_lengkap: namaLengkap, kelas_id: kelasId });
      detailBerhasil.push({ baris: lineNumber, id: siswa.id, nis });
    } catch (err) {
      const alasan = err instanceof AppError ? err.message : 'Gagal menyimpan';
      detailGagal.push({ baris: lineNumber, nis, alasan });
    }
  }

  return {
    total: rows.length,
    berhasil: detailBerhasil.length,
    gagal: detailGagal.length,
    detail_berhasil: detailBerhasil,
    detail_gagal: detailGagal,
  };
}
