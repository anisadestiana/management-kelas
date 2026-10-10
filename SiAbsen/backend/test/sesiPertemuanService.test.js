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

const sesi = await import('../src/services/sesiPertemuan.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('list: tanpa kelas_mapel_id melempar VALIDATION_ERROR', async () => {
  await assert.rejects(sesi.list({}), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('create: kelas_mapel tidak ada melempar 400', async () => {
  queue = [[]]; // assertKelasMapelExists kosong
  await assert.rejects(
    sesi.create({ kelas_mapel_id: 'x', tanggal: '2026-02-01', pertemuan_ke: 1 }),
    (err) => {
      assert.equal(err.code, 'KELAS_MAPEL_TIDAK_DITEMUKAN');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('create: sesi duplikat melempar KONFLIK 409', async () => {
  queue = [
    [{ id: 'km1' }], // assertKelasMapelExists
    [{ id: 'ada' }], // assertSesiUnik -> ada duplikat
  ];
  await assert.rejects(
    sesi.create({ kelas_mapel_id: 'km1', tanggal: '2026-02-01', pertemuan_ke: 1 }),
    (err) => {
      assert.equal(err.code, 'KONFLIK');
      assert.equal(err.status, 409);
      return true;
    }
  );
});

test('create: valid -> INSERT', async () => {
  queue = [
    [{ id: 'km1' }], // assertKelasMapelExists
    [], // assertSesiUnik: tidak ada duplikat
    [{ id: 's1', kelas_mapel_id: 'km1', tanggal: '2026-02-01', pertemuan_ke: 1, topik: null }],
  ];
  const row = await sesi.create({ kelas_mapel_id: 'km1', tanggal: '2026-02-01', pertemuan_ke: 1 });
  assert.equal(row.id, 's1');
  assert.match(calls[2], /INSERT INTO sesi_pertemuan/);
});

test('update: ubah topik saja tidak memicu cek unik', async () => {
  const existing = {
    id: 's1', kelas_mapel_id: 'km1', tanggal: '2026-02-01', pertemuan_ke: 1, topik: 'Lama',
  };
  queue = [
    [existing], // getById
    [{ ...existing, topik: 'Baru' }], // UPDATE
  ];
  const row = await sesi.update('s1', { topik: 'Baru' });
  assert.equal(row.topik, 'Baru');
  // Hanya 2 panggilan: getById + UPDATE (tidak ada SELECT cek unik)
  assert.equal(calls.length, 2);
});

test('remove: tidak ada melempar NOT_FOUND', async () => {
  queue = [[]];
  await assert.rejects(sesi.remove('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});
