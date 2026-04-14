import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

export const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export function randomId() {
  return randomBytes(5).toString('hex');
}

export function randomUser(overrides = {}) {
  const id = randomId();
  return {
    username: `t_${id}`,
    email: `t_${id}@example.test`,
    password: 'TestPass1!',
    displayName: `Test ${id}`,
    ...overrides,
  };
}

export async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { status: res.status, data, headers: res.headers };
}

export async function signup(overrides = {}) {
  const creds = randomUser(overrides);
  const res = await api('POST', '/api/auth/signup', { body: creds });
  assert.equal(res.status, 201, `signup failed (${res.status}): ${JSON.stringify(res.data)}`);
  return { token: res.data.token, user: res.data.user, creds };
}

export async function sendQuestion(username, body) {
  return api('POST', `/api/users/${username}/questions`, { body: { body } });
}

export function pickId(obj) {
  return obj?.id ?? obj?._id ?? null;
}
