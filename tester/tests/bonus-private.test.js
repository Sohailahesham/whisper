import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion, pickId } from '../helpers.js';

function pickList(res) {
  return Array.isArray(res.data) ? res.data : res.data.data;
}

describe('[bonus] Private answers', () => {
  test('private answer is hidden from per-user public feed', async () => {
    const s = await signup();
    const q = await sendQuestion(s.user.username, 'secret q');
    const qid = pickId(q.data);
    await api('POST', `/api/questions/${qid}/answer`, {
      token: s.token, body: { answer: 'secret a', visibility: 'private' },
    });
    const res = await api('GET', `/api/users/${s.user.username}/questions`);
    const bodies = pickList(res).map((x) => x.body);
    assert.ok(!bodies.includes('secret q'));
  });

  test('private answer is hidden from global feed', async () => {
    const s = await signup();
    const q = await sendQuestion(s.user.username, 'secret q2');
    const qid = pickId(q.data);
    await api('POST', `/api/questions/${qid}/answer`, {
      token: s.token, body: { answer: 'secret a2', visibility: 'private' },
    });
    const res = await api('GET', '/api/feed');
    const bodies = pickList(res).map((x) => x.body);
    assert.ok(!bodies.includes('secret q2'));
  });

  test('owner still sees private answered question in inbox', async () => {
    const s = await signup();
    const q = await sendQuestion(s.user.username, 'still-mine');
    const qid = pickId(q.data);
    await api('POST', `/api/questions/${qid}/answer`, {
      token: s.token, body: { answer: 'yep', visibility: 'private' },
    });
    const res = await api('GET', '/api/questions/inbox?status=answered', { token: s.token });
    const ids = pickList(res).map((x) => x.id || x._id);
    assert.ok(ids.includes(qid));
  });
});
