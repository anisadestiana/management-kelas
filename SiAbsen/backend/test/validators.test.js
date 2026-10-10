import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, changePasswordSchema } from '../src/validators/auth.js';

test('loginSchema: input valid lolos', () => {
  const r = loginSchema.safeParse({ username: 'guru', password: 'x' });
  assert.equal(r.success, true);
});

test('loginSchema: username kosong ditolak', () => {
  const r = loginSchema.safeParse({ username: '', password: 'x' });
  assert.equal(r.success, false);
  assert.ok(r.error.flatten().fieldErrors.username);
});

test('changePasswordSchema: password baru < 8 karakter ditolak', () => {
  const r = changePasswordSchema.safeParse({ oldPassword: 'lama', newPassword: 'pendek' });
  assert.equal(r.success, false);
  assert.ok(r.error.flatten().fieldErrors.newPassword);
});

test('changePasswordSchema: input valid lolos', () => {
  const r = changePasswordSchema.safeParse({ oldPassword: 'lama', newPassword: 'password-baru' });
  assert.equal(r.success, true);
});
