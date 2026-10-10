import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTahunAjaranSchema,
  updateTahunAjaranSchema,
} from '../src/validators/tahunAjaran.js';
import { createKelasSchema } from '../src/validators/kelas.js';
import { createMapelSchema } from '../src/validators/mapel.js';
import { createKelasMapelSchema } from '../src/validators/kelasMapel.js';
import { createSiswaSchema, importSiswaSchema } from '../src/validators/siswa.js';
import {
  createKomponenNilaiSchema,
  updateKomponenNilaiSchema,
} from '../src/validators/komponenNilai.js';
import { createPenilaianSchema } from '../src/validators/penilaian.js';
import { upsertNilaiSchema } from '../src/validators/nilai.js';
import { createSesiSchema } from '../src/validators/sesiPertemuan.js';
import { upsertAbsensiSchema } from '../src/validators/absensi.js';
import { createPengajuanSchema, putuskanPengajuanSchema } from '../src/validators/pengajuan.js';

const UUID = '11111111-1111-1111-1111-111111111111';

// Helper tanggal relatif terhadap hari ini (UTC), format YYYY-MM-DD.
function hariDariSekarang(offset) {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
  return utc.toISOString().slice(0, 10);
}

// --- Tahun Ajaran ---
test('createTahunAjaranSchema: valid lolos', () => {
  const r = createTahunAjaranSchema.safeParse({ nama: '2026/2027', semester: 'ganjil' });
  assert.equal(r.success, true);
});

test('createTahunAjaranSchema: semester salah ditolak', () => {
  const r = createTahunAjaranSchema.safeParse({ nama: 'x', semester: 'musim_panas' });
  assert.equal(r.success, false);
});

test('updateTahunAjaranSchema: objek kosong ditolak', () => {
  const r = updateTahunAjaranSchema.safeParse({});
  assert.equal(r.success, false);
});

// --- Kelas ---
test('createKelasSchema: tahun_ajaran_id bukan uuid ditolak', () => {
  const r = createKelasSchema.safeParse({ tahun_ajaran_id: 'bukan-uuid', nama: '7A' });
  assert.equal(r.success, false);
});

test('createKelasSchema: valid lolos', () => {
  const r = createKelasSchema.safeParse({ tahun_ajaran_id: UUID, nama: '7A' });
  assert.equal(r.success, true);
});

// --- Mapel ---
test('createMapelSchema: nama wajib', () => {
  const r = createMapelSchema.safeParse({ kode: 'MTK' });
  assert.equal(r.success, false);
});

test('createMapelSchema: kode boleh null', () => {
  const r = createMapelSchema.safeParse({ nama: 'Matematika', kode: null });
  assert.equal(r.success, true);
});

// --- Kelas-Mapel ---
test('createKelasMapelSchema: butuh dua uuid valid', () => {
  const r = createKelasMapelSchema.safeParse({ kelas_id: UUID, mapel_id: UUID });
  assert.equal(r.success, true);
  const bad = createKelasMapelSchema.safeParse({ kelas_id: UUID, mapel_id: 'x' });
  assert.equal(bad.success, false);
});

// --- Siswa ---
test('createSiswaSchema: nis & nama wajib, password opsional', () => {
  const r = createSiswaSchema.safeParse({ nis: '2026001', nama_lengkap: 'Budi' });
  assert.equal(r.success, true);
});

test('createSiswaSchema: password terlalu pendek ditolak', () => {
  const r = createSiswaSchema.safeParse({ nis: '1', nama_lengkap: 'Budi', password: 'short' });
  assert.equal(r.success, false);
});

test('importSiswaSchema: csv wajib', () => {
  const r = importSiswaSchema.safeParse({ csv: '' });
  assert.equal(r.success, false);
});

test('importSiswaSchema: valid lolos', () => {
  const r = importSiswaSchema.safeParse({ csv: 'nis,nama_lengkap\n1,A' });
  assert.equal(r.success, true);
});

// --- Komponen Nilai ---
test('createKomponenNilaiSchema: valid lolos', () => {
  const r = createKomponenNilaiSchema.safeParse({ kelas_mapel_id: UUID, nama: 'UTS', bobot: 30 });
  assert.equal(r.success, true);
});

test('createKomponenNilaiSchema: bobot > 100 ditolak', () => {
  const r = createKomponenNilaiSchema.safeParse({ kelas_mapel_id: UUID, nama: 'UTS', bobot: 150 });
  assert.equal(r.success, false);
});

test('createKomponenNilaiSchema: bobot wajib angka', () => {
  const r = createKomponenNilaiSchema.safeParse({ kelas_mapel_id: UUID, nama: 'UTS', bobot: '30' });
  assert.equal(r.success, false);
});

test('updateKomponenNilaiSchema: objek kosong ditolak', () => {
  const r = updateKomponenNilaiSchema.safeParse({});
  assert.equal(r.success, false);
});

// --- Penilaian ---
test('createPenilaianSchema: valid lolos', () => {
  const r = createPenilaianSchema.safeParse({ komponen_id: UUID, judul: 'Ulangan 1' });
  assert.equal(r.success, true);
});

test('createPenilaianSchema: tanggal format salah ditolak', () => {
  const r = createPenilaianSchema.safeParse({ komponen_id: UUID, judul: 'x', tanggal: '01-02-2026' });
  assert.equal(r.success, false);
});

test('createPenilaianSchema: judul kosong ditolak', () => {
  const r = createPenilaianSchema.safeParse({ komponen_id: UUID, judul: '' });
  assert.equal(r.success, false);
});

// --- Nilai ---
test('upsertNilaiSchema: valid lolos (skor angka & null)', () => {
  const r = upsertNilaiSchema.safeParse({
    penilaian_id: UUID,
    nilai: [{ siswa_id: UUID, skor: 90 }, { siswa_id: UUID, skor: null }],
  });
  assert.equal(r.success, true);
});

test('upsertNilaiSchema: skor > 100 ditolak', () => {
  const r = upsertNilaiSchema.safeParse({
    penilaian_id: UUID,
    nilai: [{ siswa_id: UUID, skor: 120 }],
  });
  assert.equal(r.success, false);
});

test('upsertNilaiSchema: array kosong ditolak', () => {
  const r = upsertNilaiSchema.safeParse({ penilaian_id: UUID, nilai: [] });
  assert.equal(r.success, false);
});

// --- Sesi Pertemuan ---
test('createSesiSchema: valid lolos', () => {
  const r = createSesiSchema.safeParse({ kelas_mapel_id: UUID, tanggal: '2026-02-01', pertemuan_ke: 1 });
  assert.equal(r.success, true);
});

test('createSesiSchema: pertemuan_ke < 1 ditolak', () => {
  const r = createSesiSchema.safeParse({ kelas_mapel_id: UUID, tanggal: '2026-02-01', pertemuan_ke: 0 });
  assert.equal(r.success, false);
});

test('createSesiSchema: tanggal wajib', () => {
  const r = createSesiSchema.safeParse({ kelas_mapel_id: UUID, pertemuan_ke: 1 });
  assert.equal(r.success, false);
});

// --- Absensi ---
test('upsertAbsensiSchema: status valid lolos', () => {
  const r = upsertAbsensiSchema.safeParse({
    sesi_id: UUID,
    absensi: [{ siswa_id: UUID, status: 'hadir' }],
  });
  assert.equal(r.success, true);
});

test('upsertAbsensiSchema: status tidak dikenal ditolak', () => {
  const r = upsertAbsensiSchema.safeParse({
    sesi_id: UUID,
    absensi: [{ siswa_id: UUID, status: 'bolos' }],
  });
  assert.equal(r.success, false);
});

test('upsertAbsensiSchema: array kosong ditolak', () => {
  const r = upsertAbsensiSchema.safeParse({ sesi_id: UUID, absensi: [] });
  assert.equal(r.success, false);
});

// --- Pengajuan Izin/Sakit ---
test('createPengajuanSchema: valid lolos (rentang pendek, hari ini)', () => {
  const r = createPengajuanSchema.safeParse({
    jenis: 'sakit',
    tanggal_mulai: hariDariSekarang(0),
    tanggal_selesai: hariDariSekarang(1),
  });
  assert.equal(r.success, true);
});

test('createPengajuanSchema: selesai sebelum mulai ditolak', () => {
  const r = createPengajuanSchema.safeParse({
    jenis: 'izin',
    tanggal_mulai: hariDariSekarang(2),
    tanggal_selesai: hariDariSekarang(1),
  });
  assert.equal(r.success, false);
});

test('createPengajuanSchema: rentang > 14 hari ditolak (IZN-6)', () => {
  const r = createPengajuanSchema.safeParse({
    jenis: 'izin',
    tanggal_mulai: hariDariSekarang(0),
    tanggal_selesai: hariDariSekarang(20),
  });
  assert.equal(r.success, false);
});

test('createPengajuanSchema: mulai mundur > 14 hari ditolak (IZN-6)', () => {
  const r = createPengajuanSchema.safeParse({
    jenis: 'sakit',
    tanggal_mulai: hariDariSekarang(-20),
    tanggal_selesai: hariDariSekarang(-20),
  });
  assert.equal(r.success, false);
});

test('createPengajuanSchema: alasan > 500 karakter ditolak', () => {
  const r = createPengajuanSchema.safeParse({
    jenis: 'izin',
    tanggal_mulai: hariDariSekarang(0),
    tanggal_selesai: hariDariSekarang(0),
    alasan: 'x'.repeat(501),
  });
  assert.equal(r.success, false);
});

test('putuskanPengajuanSchema: keputusan tidak valid ditolak', () => {
  const r = putuskanPengajuanSchema.safeParse({ keputusan: 'mungkin' });
  assert.equal(r.success, false);
});
