import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion, pickId } from '../helpers.js';

async function createQuestionFor(user) {
  const q = await sendQuestion(user.username, 'test q');
  return pickId(q.data);
}

function pickList(res) {
  return Array.isArray(res.data) ? res.data : res.data.data;
}

describe('Answer / update / delete', () => {
  test('owner can answer their question', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const res = await api('POST', `/api/questions/${qid}/answer`, {
      token: s.token, body: { answer: 'the answer' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.answer, 'the answer');
    assert.equal(res.data.status, 'answered');
    assert.ok(res.data.answeredAt);
  });

  test('answering requires auth', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const res = await api('POST', `/api/questions/${qid}/answer`, { body: { answer: 'x' } });
    assert.equal(res.status, 401);
  });

  test('cross-user answer is forbidden (403 or 404)', async () => {
    const owner = await signup();
    const other = await signup();
    const qid = await createQuestionFor(owner.user);
    const res = await api('POST', `/api/questions/${qid}/answer`, {
      token: other.token, body: { answer: 'hijack' },
    });
    assert.ok([403, 404].includes(res.status), `got ${res.status}`);
  });

  test('answer with empty string returns 400', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const res = await api('POST', `/api/questions/${qid}/answer`, {
      token: s.token, body: { answer: '' },
    });
    assert.equal(res.status, 400);
  });

  test('owner can ignore a question via PATCH', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const res = await api('PATCH', `/api/questions/${qid}`, {
      token: s.token, body: { status: 'ignored' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ignored');
  });

  test('PATCH with empty body returns 400', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const res = await api('PATCH', `/api/questions/${qid}`, { token: s.token, body: {} });
    assert.equal(res.status, 400);
  });

  test('owner can delete a question', async () => {
    const s = await signup();
    const qid = await createQuestionFor(s.user);
    const del = await api('DELETE', `/api/questions/${qid}`, { token: s.token });
    assert.ok([200, 204].includes(del.status));
    const inbox = await api('GET', '/api/questions/inbox', { token: s.token });
    const ids = pickList(inbox).map((q) => q.id || q._id);
    assert.ok(!ids.includes(qid));
  });

  test('cross-user delete is forbidden (403 or 404)', async () => {
    const owner = await signup();
    const other = await signup();
    const qid = await createQuestionFor(owner.user);
    const res = await api('DELETE', `/api/questions/${qid}`, { token: other.token });
    assert.ok([403, 404].includes(res.status));
  });
});
