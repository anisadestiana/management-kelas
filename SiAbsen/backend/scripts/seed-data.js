// scripts/seed-data.js — Seed data realistis untuk testing (Option A / PRD V1).
//
// Membuat master data awal: satu tahun ajaran aktif, beberapa kelas, mata
// pelajaran, penugasan mapel ke kelas (kelas_mapel), siswa, dan penempatan
// siswa ke kelas (siswa_kelas). Relasi dibuat valid sesuai constraint skema
// (NIS/username unik, satu siswa satu kelas per tahun ajaran, kelas_mapel unik).
//
// Model PRD V1: SATU guru (dibuat oleh seed-guru.js) yang memegang seluruh
// kelas & mapel. Tidak ada role admin dan tidak ada penugasan per-guru —
// kelas_mapel menghubungkan kelas <-> mapel, bukan guru <-> kelas.
//
// Idempoten: aman dijalankan ulang. Memakai ON CONFLICT pada constraint unik
// yang ada; untuk tabel tanpa constraint unik alami (kelas_mapel sudah unik,
// siswa_kelas sudah unik) kita cek-lalu-insert. Password siswa di-hash; NIS
// dipakai sebagai username. TIDAK mencetak password/hash.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../src/lib/password.js';

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL_DIRECT atau DATABASE_URL belum diatur');
  process.exit(1);
}

const sql = neon(connectionString);

// Password sementara seragam untuk seluruh siswa hasil seed (hanya untuk testing).
const SISWA_DEFAULT_PASSWORD = process.env.SISWA_SEED_PASSWORD || 'Siswa123!';

// --- Definisi data ---------------------------------------------------------

const TAHUN_AJARAN = { nama: '2025/2026', semester: 'ganjil' };

const KELAS = ['7A', '7B', '8A'];

const MAPEL = [
  { nama: 'Matematika', kode: 'MTK' },
  { nama: 'IPA', kode: 'IPA' },
  { nama: 'Bahasa Indonesia', kode: 'BIN' },
  { nama: 'Bahasa Inggris', kode: 'BIG' },
  { nama: 'IPS', kode: 'IPS' },
];

// Mapel yang diajarkan tiap kelas (kode mapel).
const KELAS_MAPEL = {
  '7A': ['MTK', 'IPA', 'BIN', 'BIG'],
  '7B': ['MTK', 'IPA', 'BIN', 'BIG'],
  '8A': ['MTK', 'IPA', 'BIN', 'BIG', 'IPS'],
};

// Siswa per kelas: { nis, nama }. NIS dipakai sebagai username (unik).
const SISWA = {
  '7A': [
    { nis: '2025001', nama: 'Adi Nugroho' },
    { nis: '2025002', nama: 'Bella Safitri' },
    { nis: '2025003', nama: 'Candra Wijaya' },
    { nis: '2025004', nama: 'Dina Maharani' },
    { nis: '2025005', nama: 'Eko Prasetyo' },
    { nis: '2025006', nama: 'Fitri Handayani' },
    { nis: '2025007', nama: 'Gilang Ramadhan' },
    { nis: '2025008', nama: 'Hana Pertiwi' },
  ],
  '7B': [
    { nis: '2025009', nama: 'Irfan Hakim' },
    { nis: '2025010', nama: 'Jihan Aulia' },
    { nis: '2025011', nama: 'Kevin Santoso' },
    { nis: '2025012', nama: 'Lia Puspita' },
    { nis: '2025013', nama: 'Miko Febrian' },
    { nis: '2025014', nama: 'Nadia Rahma' },
    { nis: '2025015', nama: 'Oscar Pradana' },
    { nis: '2025016', nama: 'Putri Lestari' },
  ],
  '8A': [
    { nis: '2024001', nama: 'Qori Amelia' },
    { nis: '2024002', nama: 'Rizky Maulana' },
    { nis: '2024003', nama: 'Sari Oktaviani' },
    { nis: '2024004', nama: 'Taufik Hidayat' },
    { nis: '2024005', nama: 'Umi Kalsum' },
    { nis: '2024006', nama: 'Vino Aditya' },
    { nis: '2024007', nama: 'Wulan Dari' },
    { nis: '2024008', nama: 'Yoga Pratama' },
  ],
};

// --- Helper upsert ----------------------------------------------------------

async function upsertTahunAjaran() {
  // Tidak ada UNIQUE alami; cek berdasarkan (nama, semester) lalu insert.
  const existing = await sql`
    SELECT id FROM tahun_ajaran WHERE nama = ${TAHUN_AJARAN.nama} AND semester = ${TAHUN_AJARAN.semester}
  `;
  if (existing.length > 0) return existing[0].id;
  const rows = await sql`
    INSERT INTO tahun_ajaran (nama, semester, is_aktif)
    VALUES (${TAHUN_AJARAN.nama}, ${TAHUN_AJARAN.semester}, true)
    RETURNING id
  `;
  return rows[0].id;
}

async function upsertKelas(tahunAjaranId, nama) {
  const rows = await sql`
    INSERT INTO kelas (tahun_ajaran_id, nama)
    VALUES (${tahunAjaranId}, ${nama})
    ON CONFLICT (tahun_ajaran_id, nama) DO UPDATE SET updated_at = now()
    RETURNING id
  `;
  return rows[0].id;
}

async function upsertMapel(nama, kode) {
  // mapel tidak punya UNIQUE pada kode; cek berdasarkan kode lalu insert.
  const existing = await sql`SELECT id FROM mapel WHERE kode = ${kode}`;
  if (existing.length > 0) return existing[0].id;
  const rows = await sql`
    INSERT INTO mapel (nama, kode) VALUES (${nama}, ${kode}) RETURNING id
  `;
  return rows[0].id;
}

async function upsertKelasMapel(kelasId, mapelId) {
  await sql`
    INSERT INTO kelas_mapel (kelas_id, mapel_id)
    VALUES (${kelasId}, ${mapelId})
    ON CONFLICT (kelas_id, mapel_id) DO NOTHING
  `;
}

async function upsertSiswa(nis, nama, hash) {
  const rows = await sql`
    INSERT INTO users (username, password_hash, role, nama_lengkap, must_change_password, is_active)
    VALUES (${nis}, ${hash}, 'siswa', ${nama}, true, true)
    ON CONFLICT (username) DO UPDATE SET
      nama_lengkap = EXCLUDED.nama_lengkap,
      role = 'siswa',
      is_active = true,
      updated_at = now()
    RETURNING id
  `;
  return rows[0].id;
}

async function upsertSiswaKelas(siswaId, kelasId) {
  await sql`
    INSERT INTO siswa_kelas (siswa_id, kelas_id)
    VALUES (${siswaId}, ${kelasId})
    ON CONFLICT (siswa_id, kelas_id) DO NOTHING
  `;
}

// --- Main -------------------------------------------------------------------

async function run() {
  try {
    const tahunAjaranId = await upsertTahunAjaran();

    // Mapel (global, lintas kelas)
    const mapelId = {};
    for (const m of MAPEL) {
      mapelId[m.kode] = await upsertMapel(m.nama, m.kode);
    }

    // Hash password siswa sekali (sama untuk semua siswa seed)
    const siswaHash = await hashPassword(SISWA_DEFAULT_PASSWORD);

    let totalKelas = 0;
    let totalKelasMapel = 0;
    let totalSiswa = 0;

    for (const namaKelas of KELAS) {
      const kelasId = await upsertKelas(tahunAjaranId, namaKelas);
      totalKelas += 1;

      // kelas_mapel
      for (const kode of KELAS_MAPEL[namaKelas]) {
        await upsertKelasMapel(kelasId, mapelId[kode]);
        totalKelasMapel += 1;
      }

      // siswa + siswa_kelas
      for (const s of SISWA[namaKelas]) {
        const siswaId = await upsertSiswa(s.nis, s.nama, siswaHash);
        await upsertSiswaKelas(siswaId, kelasId);
        totalSiswa += 1;
      }
    }

    console.log('Seed data selesai.');
    console.log(`  Tahun ajaran : ${TAHUN_AJARAN.nama} (${TAHUN_AJARAN.semester}, aktif)`);
    console.log(`  Mapel        : ${MAPEL.length}`);
    console.log(`  Kelas        : ${totalKelas}`);
    console.log(`  Kelas-Mapel  : ${totalKelasMapel} penugasan`);
    console.log(`  Siswa        : ${totalSiswa} (username = NIS)`);
    console.log('  Password sementara siswa diambil dari SISWA_SEED_PASSWORD (default: Siswa123!).');
    process.exit(0);
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (/relation .* does not exist/i.test(message)) {
      console.error('Tabel belum ada. Jalankan "npm run migrate" terlebih dahulu, lalu ulangi seed.');
    } else {
      console.error('Gagal melakukan seed data:', message);
    }
    process.exit(1);
  }
}

run();
