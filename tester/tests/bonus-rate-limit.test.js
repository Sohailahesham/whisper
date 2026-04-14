import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, signup, sendQuestion } from '../helpers.js';

describe('[bonus] Rate limit on anonymous sends', () => {
  test('burst of 11 sends hits 429 on the last', async () => {
    const { user } = await signup();
    const results = [];
    for (let i = 0; i < 11; i++) {
      results.push(await sendQuestion(user.username, `burst ${i}`));
    }
    const statuses = results.map((r) => r.status);
    assert.ok(statuses.slice(0, 10).every((s) => s === 201), `first 10 should be 201, got ${statuses.slice(0, 10)}`);
    assert.equal(statuses[10], 429, `11th should be 429, got ${statuses[10]}`);
  });
});
