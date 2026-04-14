# Whisper — API Reference

All routes under `/api`. All bodies are JSON. Auth via `Authorization: Bearer <JWT>`.

Error shape (free-form — tester asserts on status codes only):
```json
{ "error": { "message": "...", "details": [ ... ] } }
```

---

## Auth

### `POST /api/auth/signup`
Public.

**Body** `{ username, email, password, displayName }`
**Success** `201` → `{ token, user }` (private projection; no `passwordHash`)
**Errors** `400` validation · `409` duplicate email/username

### `POST /api/auth/login`
Public.

**Body** `{ email, password }`
**Success** `200` → `{ token, user }`
**Errors** `400` validation · `401` invalid credentials (generic message — don't leak which field was wrong)

### `GET /api/auth/me`
Auth required.

**Success** `200` → private user projection
**Errors** `401` missing/invalid/expired token

---

## Profile

### `GET /api/users/:username`
Public.

**Success** `200` → **public** projection — omit `email` and `passwordHash`
**Errors** `404`

### `PATCH /api/users/me`
Auth required. Body: any subset of `{ displayName, bio, avatarUrl, acceptingQuestions, tags }`.

- At least one field required → otherwise `400`
- `username` and `email` are immutable here — **silently ignore** them if sent
- Validates per [VALIDATION.md](./VALIDATION.md)

**Success** `200` → updated private projection
**Errors** `400` · `401`

---

## Send question (anonymous)

### `POST /api/users/:username/questions`
Public, **no auth**.

**Body** `{ body }` — 1–500 chars.
**Success** `201` → question **without** `recipient` field. Response MUST NOT leak sender or recipient id.
**Errors** `400` · `404` unknown user · `403` recipient is not accepting · `429` rate-limited (bonus)

Rate limit (bonus): 10 requests per hour per `(client-ip, :username)`. Use `X-Forwarded-For` (first IP) behind proxies.

---

## Inbox (owner-only)

All require auth. All ownership failures: `403` (or `404` — tester accepts either).

### `GET /api/questions/inbox`
Query: `?status=pending|answered|ignored` · `?page` (≥1, default 1) · `?limit` (1–50, default 20)

**Success** `200` → `{ data, page, limit, total, totalPages }`. Sorted `createdAt` DESC.

### `POST /api/questions/:id/answer`
Body `{ answer }` (1–1000 chars) · optional `visibility: "public" | "private"` (bonus).
Sets `answer`, `answeredAt=now`, `status="answered"`.

### `PATCH /api/questions/:id`
Body: any of `{ answer, status, visibility }`. At least one required → otherwise `400`.
If `answer` provided, also sets `answeredAt` + `status="answered"`.

### `DELETE /api/questions/:id`
**Success** `204` (or `200`) — tester accepts either.

---

## Public feeds

### `GET /api/users/:username/questions`
Public. Lists a user's **answered + public** questions.

- Sorted `answeredAt` DESC
- Paginated (same envelope)
- `recipient` NOT included (username is in the URL)
- Private answers are hidden (bonus)

**Errors** `404` unknown user.

### `GET /api/feed`
Public. Site-wide **answered + public** questions.

- `?tag=xxx` → only questions whose recipient has that tag
- Items include a minimal recipient projection: `{ username, displayName, avatarUrl, tags }` — never `email` or `passwordHash`
- Same pagination envelope

---

## Response conventions

- **Never** include `passwordHash` anywhere.
- **Never** include `email` in public (non-owner) responses.
- **Never** include `recipient` in the `POST /api/users/:username/questions` response.
- Use a Mongoose `toJSON` transform that maps `_id → id` and strips `passwordHash`.
- CORS enabled globally.

## Authorization rules

| Action | Who |
|---|---|
| Sign up / log in / view public profile / browse feeds | Anyone |
| Send anonymous question | Anyone (if recipient accepts) |
| Read inbox · answer · update · delete a question | Recipient only |
| Update own profile | Self only |
