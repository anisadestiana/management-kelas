// src/services/pengajuan.js — Logika bisnis Pengajuan Izin/Sakit (PRD §4.5).
//
// Skema (0001_init.sql): pengajuan_izin(siswa_id, jenis, tanggal_mulai,
// tanggal_selesai, alasan, status DEFAULT 'menunggu', catatan_guru,
// diputuskan_oleh, diputuskan_pada, CHECK (tanggal_selesai >= tanggal_mulai)).
//
// Peran (PRD §2.2):
//   - Siswa: buat, lihat MILIKNYA, batalkan selama 'menunggu' (IZN-3).
//   - Guru : lihat semua (filter status), putuskan setujui/tolak (IZN-4).
//
// Persetujuan (IZN-5, ABS-4, §3.4.3): dalam SATU transaksi, status pengajuan
// jadi 'disetujui' DAN absensi siswa pada semua sesi yang tanggalnya dalam
// rentang (dan di kelas tempat siswa terdaftar) di-upsert menjadi
// status='izin_sakit', sumber='izin_disetujui'. Memakai sql.transaction([...]).
import { AppError } from '../lib/appError.js';
import { sql } from '../db.js';

/** Buat pengajuan baru (oleh siswa). Status awal 'menunggu'. */
export async function create(siswaId, data) {
  const { jenis, tanggal_mulai, tanggal_selesai, alasan = null } = data;
  const rows = await sql`
    INSERT INTO pengajuan_izin (siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan)
    VALUES (${siswaId}, ${jenis}, ${tanggal_mulai}, ${tanggal_selesai}, ${alasan})
    RETURNING id, siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status,
              catatan_guru, diputuskan_oleh, diputuskan_pada, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Daftar pengajuan. Bila siswaId diberikan, dibatasi milik siswa itu
 * (aturan keamanan inti PRD: WHERE siswa_id = user.id). Guru: siswaId null.
 */
export async function list({ siswaId = null, status = null } = {}) {
  if (siswaId && status) {
    return sql`
      SELECT p.id, p.siswa_id, p.jenis, p.tanggal_mulai, p.tanggal_selesai, p.alasan,
             p.status, p.catatan_guru, p.diputuskan_oleh, p.diputuskan_pada,
             p.created_at, p.updated_at, u.nama_lengkap AS siswa_nama, u.username AS nis
      FROM pengajuan_izin p JOIN users u ON u.id = p.siswa_id
      WHERE p.siswa_id = ${siswaId} AND p.status = ${status}
      ORDER BY p.created_at DESC
    `;
  }
  if (siswaId) {
    return sql`
      SELECT p.id, p.siswa_id, p.jenis, p.tanggal_mulai, p.tanggal_selesai, p.alasan,
             p.status, p.catatan_guru, p.diputuskan_oleh, p.diputuskan_pada,
             p.created_at, p.updated_at, u.nama_lengkap AS siswa_nama, u.username AS nis
      FROM pengajuan_izin p JOIN users u ON u.id = p.siswa_id
      WHERE p.siswa_id = ${siswaId}
      ORDER BY p.created_at DESC
    `;
  }
  if (status) {
    return sql`
      SELECT p.id, p.siswa_id, p.jenis, p.tanggal_mulai, p.tanggal_selesai, p.alasan,
             p.status, p.catatan_guru, p.diputuskan_oleh, p.diputuskan_pada,
             p.created_at, p.updated_at, u.nama_lengkap AS siswa_nama, u.username AS nis
      FROM pengajuan_izin p JOIN users u ON u.id = p.siswa_id
      WHERE p.status = ${status}
      ORDER BY p.created_at DESC
    `;
  }
  return sql`
    SELECT p.id, p.siswa_id, p.jenis, p.tanggal_mulai, p.tanggal_selesai, p.alasan,
           p.status, p.catatan_guru, p.diputuskan_oleh, p.diputuskan_pada,
           p.created_at, p.updated_at, u.nama_lengkap AS siswa_nama, u.username AS nis
    FROM pengajuan_izin p JOIN users u ON u.id = p.siswa_id
    ORDER BY p.created_at DESC
  `;
}

/** Ambil satu pengajuan (mentah, tanpa join), atau lempar 404. */
export async function getById(id) {
  const rows = await sql`
    SELECT id, siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status,
           catatan_guru, diputuskan_oleh, diputuskan_pada, created_at, updated_at
    FROM pengajuan_izin WHERE id = ${id}
  `;
  const row = rows[0];
  if (!row) {
    throw new AppError('NOT_FOUND', 'Pengajuan tidak ditemukan', 404);
  }
  return row;
}

/**
 * Batalkan pengajuan milik siswa (IZN-3). Hanya boleh bila status 'menunggu'
 * dan milik siswa tersebut.
 */
export async function batal(id, siswaId) {
  const row = await getById(id);
  if (row.siswa_id !== siswaId) {
    // Jangan bocorkan keberadaan data milik orang lain: perlakukan sebagai 404.
    throw new AppError('NOT_FOUND', 'Pengajuan tidak ditemukan', 404);
  }
  if (row.status !== 'menunggu') {
    throw new AppError('STATUS_TIDAK_VALID', 'Hanya pengajuan menunggu yang dapat dibatalkan', 409);
  }
  const rows = await sql`
    UPDATE pengajuan_izin SET status = 'dibatalkan', updated_at = now()
    WHERE id = ${id} AND status = 'menunggu'
    RETURNING id, siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status,
              catatan_guru, diputuskan_oleh, diputuskan_pada, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Putuskan pengajuan (guru). keputusan: 'setujui' | 'tolak'.
 * Hanya boleh dari status 'menunggu'. Jika disetujui: update absensi otomatis
 * dalam SATU transaksi (IZN-5).
 */
export async function putuskan(id, guruId, keputusan, catatanGuru = null) {
  const row = await getById(id);
  if (row.status !== 'menunggu') {
    throw new AppError('STATUS_TIDAK_VALID', 'Pengajuan sudah diputuskan', 409);
  }

  if (keputusan === 'tolak') {
    // Penolakan tidak mengubah absensi (§5.4).
    const rows = await sql`
      UPDATE pengajuan_izin SET
        status = 'ditolak', catatan_guru = ${catatanGuru},
        diputuskan_oleh = ${guruId}, diputuskan_pada = now(), updated_at = now()
      WHERE id = ${id} AND status = 'menunggu'
      RETURNING id, siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status,
                catatan_guru, diputuskan_oleh, diputuskan_pada, created_at, updated_at
    `;
    return rows[0];
  }

  // keputusan === 'setujui'
  // Cari sesi yang sudah ada dalam rentang tanggal, di kelas tempat siswa terdaftar.
  const sesiCocok = await sql`
    SELECT sp.id AS sesi_id
    FROM sesi_pertemuan sp
    JOIN kelas_mapel km ON km.id = sp.kelas_mapel_id
    JOIN siswa_kelas sk ON sk.kelas_id = km.kelas_id
    WHERE sk.siswa_id = ${row.siswa_id}
      AND sp.tanggal BETWEEN ${row.tanggal_mulai} AND ${row.tanggal_selesai}
  `;

  // Susun statement untuk SATU transaksi (IZN-5): update status + upsert absensi.
  const statements = [
    sql`
      UPDATE pengajuan_izin SET
        status = 'disetujui', catatan_guru = ${catatanGuru},
        diputuskan_oleh = ${guruId}, diputuskan_pada = now(), updated_at = now()
      WHERE id = ${id} AND status = 'menunggu'
    `,
  ];

  for (const { sesi_id } of sesiCocok) {
    statements.push(sql`
      INSERT INTO absensi (sesi_id, siswa_id, status, sumber)
      VALUES (${sesi_id}, ${row.siswa_id}, 'izin_sakit', 'izin_disetujui')
      ON CONFLICT (sesi_id, siswa_id)
      DO UPDATE SET status = 'izin_sakit', sumber = 'izin_disetujui', updated_at = now()
    `);
  }

  await sql.transaction(statements);

  return {
    ...(await getById(id)),
    sesi_terpengaruh: sesiCocok.length,
  };
}
