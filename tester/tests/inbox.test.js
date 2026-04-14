import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion } from '../helpers.js';

function pickList(res) {
  return Array.isArray(res.data) ? res.data : res.data.data;
}

describe('Inbox', () => {
  test('GET /api/questions/inbox returns paginated envelope', async () => {
    const { token, user } = await signup();
    await sendQuestion(user.username, 'q1');
    await sendQuestion(user.username, 'q2');
    const res = await api('GET', '/api/questions/inbox', { token });
    assert.equal(res.status, 200);
    const items = pickList(res);
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 2);
    assert.equal(typeof res.data.page, 'number');
    assert.equal(typeof res.data.total, 'number');
  });

  test('inbox requires auth — 401 without token', async () => {
    const res = await api('GET', '/api/questions/inbox');
    assert.equal(res.status, 401);
  });

  test('inbox only shows my questions', async () => {
    const alice = await signup();
    const bob = await signup();
    await sendQuestion(alice.user.username, 'for-alice');
    await sendQuestion(bob.user.username, 'for-bob');
    const res = await api('GET', '/api/questions/inbox', { token: alice.token });
    const items = pickList(res);
    const bodies = items.map((q) => q.body);
    assert.ok(!bodies.includes('for-bob'), "alice should not see bob's questions");
  });

  test('?status=pending filters to pending only', async () => {
    const { token, user } = await signup();
    await sendQuestion(user.username, 'pending-q');
    const res = await api('GET', '/api/questions/inbox?status=pending', { token });
    assert.equal(res.status, 200);
    for (const q of pickList(res)) assert.equal(q.status, 'pending');
  });

  test('?limit=1 returns at most one item', async () => {
    const { token, user } = await signup();
    await sendQuestion(user.username, 'a');
    await sendQuestion(user.username, 'b');
    const res = await api('GET', '/api/questions/inbox?limit=1', { token });
    assert.ok(pickList(res).length <= 1);
    assert.equal(res.data.limit, 1);
  });
});
