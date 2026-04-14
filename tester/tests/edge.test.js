import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../helpers.js';

describe('Edge cases', () => {
  test('unknown /api route returns 404', async () => {
    const res = await api('GET', '/api/this-does-not-exist');
    assert.equal(res.status, 404);
  });

  test('malformed JWT returns 401 on protected route', async () => {
    const res = await api('GET', '/api/auth/me', { token: 'garbage.token.value' });
    assert.equal(res.status, 401);
  });
});
