import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/lib/csv.js';

test('parseCsv: header dinormalisasi ke lowercase', () => {
  const { header } = parseCsv('NIS,Nama_Lengkap\n1,Budi');
  assert.deepEqual(header, ['nis', 'nama_lengkap']);
});

test('parseCsv: memetakan sel ke objek berdasarkan header', () => {
  const { rows } = parseCsv('nis,nama_lengkap\n2026001,Budi');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].data, { nis: '2026001', nama_lengkap: 'Budi' });
});

test('parseCsv: koma di dalam kutip tidak memecah sel', () => {
  const { rows } = parseCsv('nis,nama_lengkap\n1,"Budi, S.Pd"');
  assert.equal(rows[0].data.nama_lengkap, 'Budi, S.Pd');
});

test('parseCsv: escape kutip ganda menjadi satu kutip', () => {
  const { rows } = parseCsv('nis,nama_lengkap\n1,"Ani ""Rajin"" Wati"');
  assert.equal(rows[0].data.nama_lengkap, 'Ani "Rajin" Wati');
});

test('parseCsv: baris kosong dilewati tetapi nomor baris tetap akurat', () => {
  const { rows } = parseCsv('nis,nama_lengkap\n1,A\n\n2,B');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].lineNumber, 2);
  assert.equal(rows[1].lineNumber, 4); // baris 3 kosong
});

test('parseCsv: mendukung newline \\r\\n', () => {
  const { rows } = parseCsv('nis,nama_lengkap\r\n1,A\r\n2,B');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].data.nis, '2');
});

test('parseCsv: teks kosong menghasilkan header & rows kosong', () => {
  const out = parseCsv('   ');
  assert.deepEqual(out.header, []);
  assert.deepEqual(out.rows, []);
});

test('parseCsv: sel yang hilang menjadi string kosong', () => {
  const { rows } = parseCsv('nis,nama_lengkap,kelas_id\n1,Budi');
  assert.equal(rows[0].data.kelas_id, '');
});
