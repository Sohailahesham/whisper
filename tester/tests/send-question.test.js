import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion, pickId, randomId } from '../helpers.js';

describe('Send anonymous question', () => {
  test('anyone can send without auth', async () => {
    const { user } = await signup();
    const res = await sendQuestion(user.username, 'What is your favorite color?');
    assert.equal(res.status, 201);
    assert.ok(pickId(res.data), 'expected question id');
    assert.equal(res.data.status, 'pending');
    assert.equal(res.data.answer, null);
  });

  test('response does not leak sender or recipient info', async () => {
    const { user } = await signup();
    const res = await sendQuestion(user.username, 'hello');
    assert.equal(res.data.recipient, undefined);
    assert.equal(res.data.senderIp, undefined);
    assert.equal(res.data.sender, undefined);
  });

  test('empty body returns 400', async () => {
    const { user } = await signup();
    const res = await api('POST', `/api/users/${user.username}/questions`, { body: { body: '' } });
    assert.equal(res.status, 400);
  });

  test('body over 500 chars returns 400', async () => {
    const { user } = await signup();
    const res = await api('POST', `/api/users/${user.username}/questions`, {
      body: { body: 'x'.repeat(600) },
    });
    assert.equal(res.status, 400);
  });

  test('missing body field returns 400', async () => {
    const { user } = await signup();
    const res = await api('POST', `/api/users/${user.username}/questions`, { body: {} });
    assert.equal(res.status, 400);
  });

  test('unknown recipient returns 404', async () => {
    const res = await sendQuestion(`nobody_${randomId()}`, 'hi');
    assert.equal(res.status, 404);
  });

  test('recipient with acceptingQuestions=false returns 403', async () => {
    const { token, user } = await signup();
    await api('PATCH', '/api/users/me', { token, body: { acceptingQuestions: false } });
    const res = await sendQuestion(user.username, 'hi');
    assert.equal(res.status, 403);
  });
});
