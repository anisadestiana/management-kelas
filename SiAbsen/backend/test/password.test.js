import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/lib/password.js';

test('hash lalu verify: password benar menghasilkan true', async () => {
  const hash = await hashPassword('rahasia123');
  assert.notEqual(hash, 'rahasia123');
  assert.equal(await verifyPassword('rahasia123', hash), true);
});

test('hash lalu verify: password salah menghasilkan false', async () => {
  const hash = await hashPassword('rahasia123');
  assert.equal(await verifyPassword('salah', hash), false);
});
