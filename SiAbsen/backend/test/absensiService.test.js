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

const absensi = await import('../src/services/absensi.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('list: tanpa sesi_id melempar VALIDATION_ERROR', async () => {
  await assert.rejects(absensi.list({}), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('list: sesi ada -> SELECT absensi join users', async () => {
  queue = [
    [{ id: 'ses1' }], // assertSesiExists
    [{ id: 'a1', siswa_id: 's1', status: 'hadir', siswa_nama: 'Budi' }],
  ];
  const rows = await absensi.list({ sesi_id: 'ses1' });
  assert.equal(rows.length, 1);
  assert.match(calls[1], /FROM absensi/);
});

test('upsert: sesi tidak ada melempar 400', async () => {
  queue = [[]]; // assertSesiExists kosong
  await assert.rejects(
    absensi.upsert('x', [{ siswa_id: 's1', status: 'hadir' }]),
    (err) => {
      assert.equal(err.code, 'SESI_TIDAK_DITEMUKAN');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('upsert: baris valid tersimpan, siswa invalid dilaporkan', async () => {
  queue = [
    [{ id: 'ses1' }], // assertSesiExists
    [{ id: 's1' }], // isSiswa(s1) -> true
    [], // upsertOne(s1)
    [], // isSiswa(s2) -> false
  ];
  const hasil = await absensi.upsert('ses1', [
    { siswa_id: 's1', status: 'hadir' },
    { siswa_id: 's2', status: 'alpha' },
  ]);
  assert.equal(hasil.total, 2);
  assert.equal(hasil.berhasil, 1);
  assert.equal(hasil.gagal, 1);
  assert.equal(hasil.detail_gagal[0].siswa_id, 's2');
  assert.ok(calls.some((c) => /INSERT INTO absensi/.test(c)));
});

test('upsert: set sumber manual pada INSERT', async () => {
  queue = [
    [{ id: 'ses1' }], // assertSesiExists
    [{ id: 's1' }], // isSiswa -> true
    [], // upsertOne
  ];
  await absensi.upsert('ses1', [{ siswa_id: 's1', status: 'izin_sakit', catatan: 'Sakit' }]);
  const insertCall = calls.find((c) => /INSERT INTO absensi/.test(c));
  assert.match(insertCall, /'manual'/);
});
