import { test, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  process.env.JWT_SECRET = 'secret-uji-coba-sekali-pakai';
  process.env.JWT_EXPIRES_IN = '1h';
});

test('sign lalu verify: payload id bertahan', async () => {
  const { signToken, verifyToken } = await import('../src/lib/jwt.js');
  const token = signToken({ id: 'abc-123' });
  const payload = verifyToken(token);
  assert.equal(payload.id, 'abc-123');
});

test('verify token sampah melempar error', async () => {
  const { verifyToken } = await import('../src/lib/jwt.js');
  assert.throws(() => verifyToken('token.tidak.valid'));
});
