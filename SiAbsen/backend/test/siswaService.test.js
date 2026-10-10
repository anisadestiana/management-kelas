import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let queue = [];
let calls = [];
function sqlImpl(strings) {
  calls.push(Array.isArray(strings) ? strings.join('?') : String(strings));
  const next = queue.shift();
  return Promise.resolve(next === undefined ? [] : next);
}

mock.module('../src/db.js', {
  exports: { sql: (...args) => sqlImpl(...args), isDbConfigured: true, checkDbConnection: async () => true },
});

const siswa = await import('../src/services/siswa.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('create: NIS duplikat melempar KONFLIK 409', async () => {
  queue = [[{ id: 'u1' }]]; // assertNisUnik menemukan baris
  await assert.rejects(siswa.create({ nis: '1', nama_lengkap: 'Budi' }), (err) => {
    assert.equal(err.code, 'KONFLIK');
    assert.equal(err.status, 409);
    return true;
  });
});

test('create: tanpa kelas berhasil & tidak sentuh siswa_kelas', async () => {
  queue = [
    [], // assertNisUnik
    [{ id: 'u1' }], // INSERT users RETURNING
    [{ id: 'u1', nis: '1', nama_lengkap: 'Budi', is_active: true }], // getById
  ];
  const row = await siswa.create({ nis: '1', nama_lengkap: 'Budi' });
  assert.equal(row.id, 'u1');
  assert.ok(!calls.some((c) => /INSERT INTO siswa_kelas/.test(c)));
});

test('getById: tidak ada melempar NOT_FOUND 404', async () => {
  queue = [[]];
  await assert.rejects(siswa.getById('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.status, 404);
    return true;
  });
});

test('resetPassword: siswa ada -> UPDATE must_change_password true', async () => {
  queue = [
    [{ id: 'u1', nis: '1', nama_lengkap: 'Budi', is_active: true }], // getById
    [], // UPDATE
  ];
  await siswa.resetPassword('u1');
  assert.match(calls[1], /must_change_password = true/);
});

test('importCsv: header tanpa kolom wajib melempar VALIDATION_ERROR', async () => {
  await assert.rejects(siswa.importCsv('foo,bar\n1,2'), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('importCsv: baris valid dibuat, baris invalid dilaporkan', async () => {
  // CSV: baris 2 valid (NIS 1), baris 3 invalid (nama kosong).
  // Baris valid memanggil: assertNisUnik [], INSERT [{id}], getById [{row}].
  queue = [
    [], // assertNisUnik untuk baris 2
    [{ id: 'u1' }], // INSERT
    [{ id: 'u1', nis: '1', nama_lengkap: 'Budi', is_active: true }], // getById
  ];
  const csv = 'nis,nama_lengkap\n1,Budi\n2,';
  const hasil = await siswa.importCsv(csv);
  assert.equal(hasil.total, 2);
  assert.equal(hasil.berhasil, 1);
  assert.equal(hasil.gagal, 1);
  assert.equal(hasil.detail_gagal[0].baris, 3);
});

test('importCsv: NIS duplikat masuk ke detail_gagal (best-effort)', async () => {
  // Satu baris, assertNisUnik mengembalikan baris -> create melempar KONFLIK.
  queue = [[{ id: 'ada' }]];
  const hasil = await siswa.importCsv('nis,nama_lengkap\n1,Budi');
  assert.equal(hasil.berhasil, 0);
  assert.equal(hasil.gagal, 1);
  assert.match(hasil.detail_gagal[0].alasan, /NIS sudah digunakan/);
});
