import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion, pickId } from '../helpers.js';

function pickList(res) {
  return Array.isArray(res.data) ? res.data : res.data.data;
}

async function sendAndAnswer(s, body, answer) {
  const q = await sendQuestion(s.user.username, body);
  const qid = pickId(q.data);
  await api('POST', `/api/questions/${qid}/answer`, { token: s.token, body: { answer } });
  return qid;
}

describe('Per-user public feed', () => {
  test('only answered questions appear', async () => {
    const s = await signup();
    await sendAndAnswer(s, 'answered-one', 'my-a');
    await sendQuestion(s.user.username, 'pending-one');
    const res = await api('GET', `/api/users/${s.user.username}/questions`);
    assert.equal(res.status, 200);
    const items = pickList(res);
    assert.ok(items.length >= 1);
    const bodies = items.map((q) => q.body);
    assert.ok(bodies.includes('answered-one'));
    assert.ok(!bodies.includes('pending-one'));
    for (const q of items) {
      assert.equal(q.status, 'answered');
      assert.ok(q.answer);
    }
  });

  test('ignored questions are hidden', async () => {
    const s = await signup();
    const q = await sendQuestion(s.user.username, 'ignored-one');
    const qid = pickId(q.data);
    await api('PATCH', `/api/questions/${qid}`, {
      token: s.token, body: { status: 'ignored' },
    });
    const res = await api('GET', `/api/users/${s.user.username}/questions`);
    const bodies = pickList(res).map((q) => q.body);
    assert.ok(!bodies.includes('ignored-one'));
  });

  test('pagination respects ?limit=', async () => {
    const s = await signup();
    for (let i = 0; i < 3; i++) await sendAndAnswer(s, `q${i}`, `a${i}`);
    const res = await api('GET', `/api/users/${s.user.username}/questions?page=1&limit=2`);
    assert.equal(res.status, 200);
    assert.ok(pickList(res).length <= 2);
    assert.equal(res.data.limit, 2);
  });

  test('404 for unknown user', async () => {
    const res = await api('GET', '/api/users/nobody_zzz/questions');
    assert.equal(res.status, 404);
  });
});
