import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Antrian hasil: tiap pemanggilan sql() mengambil elemen berikutnya.
// Juga mencatat apakah query mengandung potongan tertentu (untuk assert efek samping).
let queue = [];
let calls = [];
function sqlImpl(strings) {
  const text = Array.isArray(strings) ? strings.join('?') : String(strings);
  calls.push(text);
  const next = queue.shift();
  return Promise.resolve(next === undefined ? [] : next);
}

mock.module('../src/db.js', {
  exports: { sql: (...args) => sqlImpl(...args), isDbConfigured: true, checkDbConnection: async () => true },
});

const tahunAjaran = await import('../src/services/tahunAjaran.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('getById: tidak ada melempar NOT_FOUND 404', async () => {
  queue = [[]];
  await assert.rejects(tahunAjaran.getById('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.status, 404);
    return true;
  });
});

test('create dengan is_aktif menonaktifkan baris lain lebih dulu', async () => {
  queue = [
    [], // UPDATE deactivateOthers
    [{ id: 'ta1', nama: '2026/2027', semester: 'ganjil', is_aktif: true }], // INSERT RETURNING
  ];
  const row = await tahunAjaran.create({ nama: '2026/2027', semester: 'ganjil', is_aktif: true });
  assert.equal(row.id, 'ta1');
  // Panggilan pertama harus UPDATE ... is_aktif = false (deactivate)
  assert.match(calls[0], /UPDATE tahun_ajaran SET is_aktif = false/);
  // Panggilan kedua harus INSERT
  assert.match(calls[1], /INSERT INTO tahun_ajaran/);
});

test('create tanpa is_aktif tidak memanggil deactivate', async () => {
  queue = [[{ id: 'ta2', nama: 'x', semester: 'genap', is_aktif: false }]];
  await tahunAjaran.create({ nama: 'x', semester: 'genap' });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /INSERT INTO tahun_ajaran/);
});

test('update: pertahankan nilai lama untuk field yang tidak dikirim', async () => {
  const existing = {
    id: 'ta1', nama: 'Lama', semester: 'ganjil',
    tanggal_mulai: '2026-01-01', tanggal_selesai: null, is_aktif: false,
  };
  queue = [
    [existing], // getById
    [{ ...existing, nama: 'Baru' }], // UPDATE RETURNING
  ];
  const row = await tahunAjaran.update('ta1', { nama: 'Baru' });
  assert.equal(row.nama, 'Baru');
  // UPDATE harus dipanggil (call kedua)
  assert.match(calls[1], /UPDATE tahun_ajaran SET/);
});

test('remove: id tidak ada melempar NOT_FOUND', async () => {
  queue = [[]]; // DELETE RETURNING kosong
  await assert.rejects(tahunAjaran.remove('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});
