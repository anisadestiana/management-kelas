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

const nilai = await import('../src/services/nilai.js');

beforeEach(() => {
  queue = [];
  calls = [];
});

test('list: tanpa penilaian_id melempar VALIDATION_ERROR', async () => {
  await assert.rejects(nilai.list({}), (err) => {
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('list: penilaian ada -> SELECT nilai join users', async () => {
  queue = [
    [{ id: 'p1' }], // assertPenilaianExists
    [{ id: 'n1', siswa_id: 's1', skor: '90.00', siswa_nama: 'Budi' }],
  ];
  const rows = await nilai.list({ penilaian_id: 'p1' });
  assert.equal(rows.length, 1);
  assert.match(calls[1], /FROM nilai/);
});

test('upsert: penilaian tidak ada melempar 400', async () => {
  queue = [[]]; // assertPenilaianExists kosong
  await assert.rejects(
    nilai.upsert('x', [{ siswa_id: 's1', skor: 90 }]),
    (err) => {
      assert.equal(err.code, 'PENILAIAN_TIDAK_DITEMUKAN');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('upsert: baris valid tersimpan, siswa invalid dilaporkan', async () => {
  queue = [
    [{ id: 'p1' }], // assertPenilaianExists
    [{ id: 's1' }], // isSiswa(s1) -> true
    [], // upsertOne(s1)
    [], // isSiswa(s2) -> false (bukan siswa)
  ];
  const hasil = await nilai.upsert('p1', [
    { siswa_id: 's1', skor: 90 },
    { siswa_id: 's2', skor: 80 },
  ]);
  assert.equal(hasil.total, 2);
  assert.equal(hasil.berhasil, 1);
  assert.equal(hasil.gagal, 1);
  assert.equal(hasil.detail_gagal[0].siswa_id, 's2');
  assert.ok(calls.some((c) => /INSERT INTO nilai/.test(c)));
});

test('upsert: skor null diperbolehkan (mengosongkan)', async () => {
  queue = [
    [{ id: 'p1' }], // assertPenilaianExists
    [{ id: 's1' }], // isSiswa -> true
    [], // upsertOne
  ];
  const hasil = await nilai.upsert('p1', [{ siswa_id: 's1', skor: null }]);
  assert.equal(hasil.berhasil, 1);
  assert.equal(hasil.gagal, 0);
});
