import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, randomId } from '../helpers.js';

describe('Profile', () => {
  test('GET /api/users/:username returns public profile', async () => {
    const { user } = await signup();
    const res = await api('GET', `/api/users/${user.username}`);
    assert.equal(res.status, 200);
    assert.equal(res.data.username, user.username);
    assert.equal(res.data.email, undefined, 'email must not be public');
    assert.equal(res.data.passwordHash, undefined);
    assert.ok(Array.isArray(res.data.tags));
  });

  test('GET /api/users/:username returns 404 for unknown user', async () => {
    const res = await api('GET', `/api/users/nobody_${randomId()}`);
    assert.equal(res.status, 404);
  });

  test('PATCH /api/users/me updates displayName and bio', async () => {
    const { token } = await signup();
    const bio = `bio ${randomId()}`;
    const displayName = `Updated ${randomId()}`;
    const res = await api('PATCH', '/api/users/me', {
      token,
      body: { bio, displayName },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.bio, bio);
    assert.equal(res.data.displayName, displayName);
  });

  test('PATCH /api/users/me requires auth', async () => {
    const res = await api('PATCH', '/api/users/me', { body: { bio: 'x' } });
    assert.equal(res.status, 401);
  });

  test('PATCH /api/users/me toggles acceptingQuestions, reflected publicly', async () => {
    const { token, user } = await signup();
    const r1 = await api('PATCH', '/api/users/me', {
      token, body: { acceptingQuestions: false },
    });
    assert.equal(r1.status, 200);
    assert.equal(r1.data.acceptingQuestions, false);

    const r2 = await api('GET', `/api/users/${user.username}`);
    assert.equal(r2.data.acceptingQuestions, false);
  });

  test('PATCH /api/users/me accepts tags array', async () => {
    const { token, user } = await signup();
    const tags = ['coding', 'music'];
    const r1 = await api('PATCH', '/api/users/me', { token, body: { tags } });
    assert.equal(r1.status, 200);
    assert.deepEqual(r1.data.tags, tags);
    const r2 = await api('GET', `/api/users/${user.username}`);
    assert.deepEqual(r2.data.tags, tags);
  });

  test('PATCH /api/users/me rejects invalid tag format with 400', async () => {
    const { token } = await signup();
    const res = await api('PATCH', '/api/users/me', {
      token, body: { tags: ['Has Space'] },
    });
    assert.equal(res.status, 400);
  });

  test('PATCH /api/users/me cannot change username or email', async () => {
    const { token, user } = await signup();
    const res = await api('PATCH', '/api/users/me', {
      token,
      body: { username: `new_${randomId()}`, email: `new_${randomId()}@example.test` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.username, user.username);
    assert.equal(res.data.email, user.email);
  });
});
