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

const mapel = await import('../src/services/mapel.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('create: nama duplikat melempar KONFLIK 409', async () => {
  queue = [[{ id: 'm1' }]]; // assertNamaUnik menemukan baris -> konflik
  await assert.rejects(mapel.create({ nama: 'Matematika' }), (err) => {
    assert.equal(err.code, 'KONFLIK');
    assert.equal(err.status, 409);
    return true;
  });
});

test('create: nama unik berhasil', async () => {
  queue = [
    [], // assertNamaUnik: tidak ada duplikat
    [{ id: 'm1', nama: 'Matematika', kode: 'MTK' }], // INSERT RETURNING
  ];
  const row = await mapel.create({ nama: 'Matematika', kode: 'MTK' });
  assert.equal(row.id, 'm1');
  assert.match(calls[1], /INSERT INTO mapel/);
});

test('getById: tidak ada melempar NOT_FOUND 404', async () => {
  queue = [[]];
  await assert.rejects(mapel.getById('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.status, 404);
    return true;
  });
});

test('remove: id tidak ada melempar NOT_FOUND', async () => {
  queue = [[]];
  await assert.rejects(mapel.remove('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});
