-- 0001_init.sql — Skema awal SiAbsen (PRD §7.2/§7.3)
-- Idempotent: aman dijalankan ulang (CREATE ... IF NOT EXISTS + guard enum DO/EXCEPTION).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- ENUM (6) — masing-masing dijaga agar aman dijalankan ulang
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('guru', 'siswa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE semester_type AS ENUM ('ganjil', 'genap');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE absensi_status AS ENUM ('hadir', 'izin_sakit', 'terlambat', 'dispensasi', 'alpha');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE absensi_sumber AS ENUM ('manual', 'izin_disetujui');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pengajuan_jenis AS ENUM ('izin', 'sakit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pengajuan_status AS ENUM ('menunggu', 'disetujui', 'ditolak', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- TABEL (15) — dalam urutan dependensi FK
-- =========================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  nama_lengkap text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. tahun_ajaran
CREATE TABLE IF NOT EXISTS tahun_ajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  semester semester_type NOT NULL,
  tanggal_mulai date,
  tanggal_selesai date,
  is_aktif boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Hanya satu tahun ajaran yang boleh aktif pada satu waktu
CREATE UNIQUE INDEX IF NOT EXISTS uq_tahun_ajaran_aktif
  ON tahun_ajaran (is_aktif) WHERE is_aktif = true;

-- 3. kelas
CREATE TABLE IF NOT EXISTS kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_ajaran_id uuid NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  nama text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tahun_ajaran_id, nama)
);

-- 4. mapel
CREATE TABLE IF NOT EXISTS mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  kode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. kelas_mapel
CREATE TABLE IF NOT EXISTS kelas_mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  mapel_id uuid NOT NULL REFERENCES mapel(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kelas_id, mapel_id)
);

-- 6. siswa_kelas
CREATE TABLE IF NOT EXISTS siswa_kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kelas_id uuid NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (siswa_id, kelas_id)
);

-- 7. komponen_nilai
CREATE TABLE IF NOT EXISTS komponen_nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_mapel_id uuid NOT NULL REFERENCES kelas_mapel(id) ON DELETE CASCADE,
  nama text NOT NULL,
  bobot numeric(5,2) NOT NULL,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. penilaian
CREATE TABLE IF NOT EXISTS penilaian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  komponen_id uuid NOT NULL REFERENCES komponen_nilai(id) ON DELETE CASCADE,
  judul text NOT NULL,
  tanggal date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. nilai
CREATE TABLE IF NOT EXISTS nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  penilaian_id uuid NOT NULL REFERENCES penilaian(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skor numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (penilaian_id, siswa_id),
  CHECK (skor IS NULL OR (skor >= 0 AND skor <= 100))
);

-- 10. sesi_pertemuan
CREATE TABLE IF NOT EXISTS sesi_pertemuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_mapel_id uuid NOT NULL REFERENCES kelas_mapel(id) ON DELETE CASCADE,
  tanggal date NOT NULL,
  pertemuan_ke integer NOT NULL,
  topik text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kelas_mapel_id, tanggal, pertemuan_ke)
);

-- 11. absensi
CREATE TABLE IF NOT EXISTS absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES sesi_pertemuan(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status absensi_status NOT NULL,
  catatan text,
  sumber absensi_sumber NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sesi_id, siswa_id)
);

-- 12. pengajuan_izin
CREATE TABLE IF NOT EXISTS pengajuan_izin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jenis pengajuan_jenis NOT NULL,
  tanggal_mulai date,
  tanggal_selesai date,
  alasan text,
  status pengajuan_status NOT NULL DEFAULT 'menunggu',
  catatan_guru text,
  diputuskan_oleh uuid REFERENCES users(id),
  diputuskan_pada timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (tanggal_selesai >= tanggal_mulai)
);

-- 13. pengaturan_risiko (penegakan satu baris ditunda ke M5; jangan seed baris di sini)
CREATE TABLE IF NOT EXISTS pengaturan_risiko (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_kehadiran_persen integer NOT NULL DEFAULT 80,
  maks_alpha integer NOT NULL DEFAULT 3,
  tren_turun_n integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 14. ai_analisis — append-only, sengaja TANPA updated_at
CREATE TABLE IF NOT EXISTS ai_analisis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE,
  kelas_mapel_id uuid REFERENCES kelas_mapel(id) ON DELETE CASCADE,
  dibuat_oleh uuid REFERENCES users(id),
  model_id text,
  status text,
  ringkasan_kelas text,
  hasil_guru jsonb,
  metrik jsonb,
  token_input integer,
  token_output integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. ai_insight_siswa
CREATE TABLE IF NOT EXISTS ai_insight_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analisis_id uuid NOT NULL REFERENCES ai_analisis(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pesan text,
  area_perhatian jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- INDEX (§7.3)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_sesi ON absensi (siswa_id, sesi_id);
CREATE INDEX IF NOT EXISTS idx_sesi_km_tanggal ON sesi_pertemuan (kelas_mapel_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai (siswa_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_status_dibuat ON pengajuan_izin (status, created_at);
CREATE INDEX IF NOT EXISTS idx_insight_siswa_dibuat ON ai_insight_siswa (siswa_id, created_at DESC);
