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

const UUID = '11111111-1111-1111-1111-111111111111';

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
