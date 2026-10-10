import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword } from '../src/lib/password.js';

// Mock db.js's `sql` tagged-template. Setiap test memasang implementasi
// `sqlImpl` yang mengembalikan baris sesuai skenario.
let sqlImpl = async () => [];
mock.module('../src/db.js', {
  exports: {
    sql: (...args) => sqlImpl(...args),
    isDbConfigured: true,
    checkDbConnection: async () => true,
  },
});

const { login, changePassword } = await import('../src/services/authService.js');

test('login: kredensial benar mengembalikan { id, role, must_change_password }', async () => {
  const hash = await hashPassword('benar123');
  sqlImpl = async () => [
    { id: 'u1', password_hash: hash, role: 'guru', must_change_password: false, is_active: true },
  ];
  const result = await login('guru', 'benar123');
  assert.deepEqual(result, { id: 'u1', role: 'guru', must_change_password: false });
});

test('login: user tidak ada melempar BAD_CREDENTIALS 401', async () => {
  sqlImpl = async () => [];
  await assert.rejects(login('tidakada', 'apa'), (err) => {
    assert.equal(err.code, 'BAD_CREDENTIALS');
    assert.equal(err.status, 401);
    return true;
  });
});

test('login: password salah melempar BAD_CREDENTIALS 401', async () => {
  const hash = await hashPassword('benar123');
  sqlImpl = async () => [
    { id: 'u1', password_hash: hash, role: 'guru', must_change_password: false, is_active: true },
  ];
  await assert.rejects(login('guru', 'salah'), (err) => {
    assert.equal(err.code, 'BAD_CREDENTIALS');
    assert.equal(err.status, 401);
    return true;
  });
});

test('login: user nonaktif melempar BAD_CREDENTIALS 401', async () => {
  const hash = await hashPassword('benar123');
  sqlImpl = async () => [
    { id: 'u1', password_hash: hash, role: 'guru', must_change_password: false, is_active: false },
  ];
  await assert.rejects(login('guru', 'benar123'), (err) => {
    assert.equal(err.code, 'BAD_CREDENTIALS');
    return true;
  });
});

test('changePassword: password lama salah melempar BAD_CREDENTIALS 400', async () => {
  const hash = await hashPassword('lamaBenar');
  sqlImpl = async () => [{ password_hash: hash }];
  await assert.rejects(changePassword('u1', 'lamaSalah', 'passwordBaru123'), (err) => {
    assert.equal(err.code, 'BAD_CREDENTIALS');
    assert.equal(err.status, 400);
    return true;
  });
});
