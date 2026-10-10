import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let queue = [];
let calls = [];
let txBatches = [];

// Meniru perilaku driver Neon: sql`...` MENGEMBALIKAN query lazy (thenable),
// baru mengambil dari antrian saat di-await. Saat dipakai dalam transaction([...]),
// query TIDAK dieksekusi sendiri (tidak mengonsumsi antrian) — hanya dihitung.
function sqlFn(strings) {
  calls.push(Array.isArray(strings) ? strings.join('?') : String(strings));
  return {
    __isQuery: true,
    then(resolve, reject) {
      const next = queue.shift();
      return Promise.resolve(next === undefined ? [] : next).then(resolve, reject);
    },
  };
}
// sql.transaction([...]) menerima array query lazy; catat jumlahnya, tidak konsumsi antrian.
sqlFn.transaction = (statements) => {
  txBatches.push(statements.length);
  return Promise.resolve(statements.map(() => []));
};

mock.module('../src/db.js', {
  exports: { sql: sqlFn, isDbConfigured: true, checkDbConnection: async () => true },
});

const pengajuan = await import('../src/services/pengajuan.js');

beforeEach(() => {
  queue = [];
  calls = [];
  txBatches = [];
});

test('create: menyisipkan pengajuan status menunggu', async () => {
  queue = [[{ id: 'pg1', siswa_id: 's1', status: 'menunggu' }]];
  const row = await pengajuan.create('s1', {
    jenis: 'sakit', tanggal_mulai: '2026-02-01', tanggal_selesai: '2026-02-02',
  });
  assert.equal(row.id, 'pg1');
  assert.match(calls[0], /INSERT INTO pengajuan_izin/);
});

test('batal: milik siswa lain diperlakukan sebagai NOT_FOUND', async () => {
  queue = [[{ id: 'pg1', siswa_id: 'LAIN', status: 'menunggu' }]]; // getById
  await assert.rejects(pengajuan.batal('pg1', 's1'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    return true;
  });
});

test('batal: status bukan menunggu ditolak 409', async () => {
  queue = [[{ id: 'pg1', siswa_id: 's1', status: 'disetujui' }]]; // getById
  await assert.rejects(pengajuan.batal('pg1', 's1'), (err) => {
    assert.equal(err.code, 'STATUS_TIDAK_VALID');
    assert.equal(err.status, 409);
    return true;
  });
});

test('putuskan: pengajuan sudah diputuskan ditolak 409', async () => {
  queue = [[{ id: 'pg1', siswa_id: 's1', status: 'ditolak' }]]; // getById
  await assert.rejects(pengajuan.putuskan('pg1', 'g1', 'setujui'), (err) => {
    assert.equal(err.code, 'STATUS_TIDAK_VALID');
    return true;
  });
});

test('putuskan tolak: UPDATE ditolak tanpa menyentuh absensi', async () => {
  queue = [
    [{ id: 'pg1', siswa_id: 's1', status: 'menunggu' }], // getById
    [{ id: 'pg1', status: 'ditolak' }], // UPDATE RETURNING
  ];
  const row = await pengajuan.putuskan('pg1', 'g1', 'tolak', 'Tidak lengkap');
  assert.equal(row.status, 'ditolak');
  assert.equal(txBatches.length, 0); // tidak ada transaksi absensi
});

test('putuskan setujui: transaksi berisi 1 UPDATE + N upsert absensi', async () => {
  queue = [
    [{ id: 'pg1', siswa_id: 's1', status: 'menunggu', tanggal_mulai: '2026-02-01', tanggal_selesai: '2026-02-03' }], // getById awal
    [{ sesi_id: 'ses1' }, { sesi_id: 'ses2' }], // sesi cocok (2 sesi)
    [{ id: 'pg1', status: 'disetujui' }], // getById akhir
  ];
  const row = await pengajuan.putuskan('pg1', 'g1', 'setujui');
  assert.equal(row.status, 'disetujui');
  assert.equal(row.sesi_terpengaruh, 2);
  // Satu transaksi dengan 1 (update pengajuan) + 2 (absensi) = 3 statement.
  assert.equal(txBatches.length, 1);
  assert.equal(txBatches[0], 3);
});

test('putuskan setujui tanpa sesi cocok: transaksi hanya 1 statement', async () => {
  queue = [
    [{ id: 'pg1', siswa_id: 's1', status: 'menunggu', tanggal_mulai: '2026-02-01', tanggal_selesai: '2026-02-01' }],
    [], // tidak ada sesi cocok
    [{ id: 'pg1', status: 'disetujui' }],
  ];
  const row = await pengajuan.putuskan('pg1', 'g1', 'setujui');
  assert.equal(row.sesi_terpengaruh, 0);
  assert.equal(txBatches[0], 1); // hanya update pengajuan
});
