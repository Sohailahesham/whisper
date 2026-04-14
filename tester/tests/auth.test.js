import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, randomUser, signup } from '../helpers.js';

describe('Auth', () => {
  test('signup with valid data returns 201 + token + user', async () => {
    const user = randomUser();
    const res = await api('POST', '/api/auth/signup', { body: user });
    assert.equal(res.status, 201);
    assert.ok(res.data.token, 'expected token');
    assert.ok(res.data.user, 'expected user');
    assert.equal(res.data.user.email, user.email);
    assert.equal(res.data.user.username, user.username);
    assert.equal(res.data.user.passwordHash, undefined, 'passwordHash must not leak');
    assert.equal(res.data.user.password, undefined, 'password must not leak');
  });

  test('signup rejects invalid email with 400', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...randomUser(), email: 'not-an-email' },
    });
    assert.equal(res.status, 400);
  });

  test('signup rejects short password with 400', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...randomUser(), password: '123' },
    });
    assert.equal(res.status, 400);
  });

  test('signup rejects duplicate email with 409', async () => {
    const { creds } = await signup();
    const res = await api('POST', '/api/auth/signup', {
      body: { ...randomUser(), email: creds.email },
    });
    assert.equal(res.status, 409);
  });

  test('signup rejects duplicate username with 409', async () => {
    const { creds } = await signup();
    const res = await api('POST', '/api/auth/signup', {
      body: { ...randomUser(), username: creds.username },
    });
    assert.equal(res.status, 409);
  });

  test('login with correct credentials returns 200 + token', async () => {
    const { creds } = await signup();
    const res = await api('POST', '/api/auth/login', {
      body: { email: creds.email, password: creds.password },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.token);
  });

  test('login with wrong password returns 401', async () => {
    const { creds } = await signup();
    const res = await api('POST', '/api/auth/login', {
      body: { email: creds.email, password: 'wrong-password-123' },
    });
    assert.equal(res.status, 401);
  });

  test('login with unknown email returns 401', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: `nobody_${Date.now()}@example.test`, password: 'anything' },
    });
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me with token returns 200 + user', async () => {
    const { token, user } = await signup();
    const res = await api('GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.data.email, user.email);
    assert.equal(res.data.passwordHash, undefined);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await api('GET', '/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me with invalid token returns 401', async () => {
    const res = await api('GET', '/api/auth/me', { token: 'invalid.token.here' });
    assert.equal(res.status, 401);
  });
});
