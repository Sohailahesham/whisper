import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion, pickId, randomId } from '../helpers.js';

function pickList(res) {
  return Array.isArray(res.data) ? res.data : res.data.data;
}

async function answerFrom(s, body, answer) {
  const q = await sendQuestion(s.user.username, body);
  const qid = pickId(q.data);
  await api('POST', `/api/questions/${qid}/answer`, { token: s.token, body: { answer } });
  return qid;
}

describe('Global feed', () => {
  test('GET /api/feed returns answered questions site-wide', async () => {
    const s = await signup();
    const tag = `unique-${randomId()}`;
    await api('PATCH', '/api/users/me', { token: s.token, body: { tags: [tag] } });
    await answerFrom(s, 'global q', 'global a');
    const res = await api('GET', '/api/feed');
    assert.equal(res.status, 200);
    const items = pickList(res);
    assert.ok(items.length >= 1);
    for (const q of items) assert.equal(q.status, 'answered');
  });

  test('GET /api/feed?tag= filters to matching users', async () => {
    const target = await signup();
    const other = await signup();
    const tag = `only-${randomId()}`;
    await api('PATCH', '/api/users/me', { token: target.token, body: { tags: [tag] } });
    await answerFrom(target, 'tagged', 'answer-tagged');
    await answerFrom(other, 'untagged', 'answer-untagged');
    const res = await api('GET', `/api/feed?tag=${tag}`);
    assert.equal(res.status, 200);
    const items = pickList(res);
    assert.ok(items.length >= 1);
    for (const q of items) {
      assert.equal(q.status, 'answered');
      assert.ok(q.recipient, 'expected recipient info in feed items');
      assert.ok(q.recipient.tags.includes(tag));
    }
  });

  test('feed items do not leak email or passwordHash', async () => {
    const s = await signup();
    await answerFrom(s, 'x', 'y');
    const res = await api('GET', '/api/feed');
    const items = pickList(res);
    for (const q of items) {
      if (q.recipient) {
        assert.equal(q.recipient.email, undefined);
        assert.equal(q.recipient.passwordHash, undefined);
      }
    }
  });

  test('pagination works', async () => {
    const res = await api('GET', '/api/feed?page=1&limit=2');
    assert.equal(res.status, 200);
    assert.ok(pickList(res).length <= 2);
    assert.equal(res.data.limit, 2);
  });
});
