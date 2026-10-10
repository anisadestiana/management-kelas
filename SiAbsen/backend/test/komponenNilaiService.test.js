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

const komponen = await import('../src/services/komponenNilai.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('list: menghitung total_bobot dari item', async () => {
  queue = [
    [{ id: 'km1' }], // assertKelasMapelExists
    [
      { id: 'k1', bobot: '40.00', urutan: 0, nama: 'Tugas' },
      { id: 'k2', bobot: '60.00', urutan: 1, nama: 'UTS' },
    ],
  ];
  const out = await komponen.list({ kelas_mapel_id: 'km1' });
  assert.equal(out.items.length, 2);
  assert.equal(out.total_bobot, 100);
});

test('list: tanpa kelas_mapel_id melempar VALIDATION_ERROR', async () => {
  await assert.rejects(komponen.list({}), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('create: kelas_mapel tidak ada melempar 400', async () => {
  queue = [[]]; // assertKelasMapelExists kosong
  await assert.rejects(
    komponen.create({ kelas_mapel_id: 'x', nama: 'Tugas', bobot: 40 }),
    (err) => {
      assert.equal(err.code, 'KELAS_MAPEL_TIDAK_DITEMUKAN');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('create: valid -> INSERT', async () => {
  queue = [
    [{ id: 'km1' }], // assertKelasMapelExists
    [{ id: 'k1', kelas_mapel_id: 'km1', nama: 'Tugas', bobot: '40.00', urutan: 0 }],
  ];
  const row = await komponen.create({ kelas_mapel_id: 'km1', nama: 'Tugas', bobot: 40 });
  assert.equal(row.id, 'k1');
  assert.match(calls[1], /INSERT INTO komponen_nilai/);
});

test('update: bobot 0 dipertahankan (bukan dianggap kosong)', async () => {
  const existing = { id: 'k1', nama: 'Tugas', bobot: '40.00', urutan: 0 };
  queue = [
    [existing], // getById
    [{ ...existing, bobot: '0.00' }], // UPDATE RETURNING
  ];
  const row = await komponen.update('k1', { bobot: 0 });
  assert.equal(Number(row.bobot), 0);
});

test('remove: tidak ada melempar NOT_FOUND', async () => {
  queue = [[]];
  await assert.rejects(komponen.remove('x'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});
