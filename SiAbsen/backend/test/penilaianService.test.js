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

const penilaian = await import('../src/services/penilaian.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('list: tanpa komponen_id melempar VALIDATION_ERROR', async () => {
  await assert.rejects(penilaian.list({}), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('list: komponen ada -> SELECT penilaian', async () => {
  queue = [
    [{ id: 'kn1' }], // assertKomponenExists
    [{ id: 'p1', komponen_id: 'kn1', judul: 'Ulangan 1', tanggal: '2026-02-01' }],
  ];
  const rows = await penilaian.list({ komponen_id: 'kn1' });
  assert.equal(rows.length, 1);
  assert.match(calls[1], /FROM penilaian/);
});

test('create: komponen tidak ada melempar 400', async () => {
  queue = [[]]; // assertKomponenExists kosong
  await assert.rejects(
    penilaian.create({ komponen_id: 'x', judul: 'Ulangan' }),
    (err) => {
      assert.equal(err.code, 'KOMPONEN_TIDAK_DITEMUKAN');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('create: valid -> INSERT', async () => {
  queue = [
    [{ id: 'kn1' }], // assertKomponenExists
    [{ id: 'p1', komponen_id: 'kn1', judul: 'Ulangan', tanggal: null }],
  ];
  const row = await penilaian.create({ komponen_id: 'kn1', judul: 'Ulangan' });
  assert.equal(row.id, 'p1');
  assert.match(calls[1], /INSERT INTO penilaian/);
});

test('update: tanggal null eksplisit mengosongkan tanggal', async () => {
  const existing = { id: 'p1', komponen_id: 'kn1', judul: 'Ulangan', tanggal: '2026-02-01' };
  queue = [
    [existing], // getById
    [{ ...existing, tanggal: null }], // UPDATE RETURNING
  ];
  const row = await penilaian.update('p1', { tanggal: null });
  assert.equal(row.tanggal, null);
});

test('remove: tidak ada melempar NOT_FOUND', async () => {
  queue = [[]];
  await assert.rejects(penilaian.remove('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});
