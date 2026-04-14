# Whisper — Validation Rules

Use **Zod**. Put schemas in `validations/` and apply via a reusable `validate(schema)` middleware that replies `400` on failure and rewrites `req.body` with the parsed value on success.

## User fields

| Field | Type | Rule |
|---|---|---|
| `username` | string | required, **unique**, 3–20 chars, `^[a-zA-Z0-9_]+$`, **immutable** after signup |
| `email` | string | required, **unique**, valid email, lowercased |
| `password` | string | required on signup/login; min 8 chars (only validated at the edge — stored as `passwordHash`) |
| `displayName` | string | required, 1–50 chars |
| `bio` | string | optional, ≤ 200 chars |
| `avatarUrl` | string | optional, valid URL or empty string, ≤ 500 chars |
| `acceptingQuestions` | boolean | default `true` |
| `tags` | string[] | 0–10 items; each matches `^[a-z0-9-]{2,20}$` (slug) |

## Question fields

| Field | Rule |
|---|---|
| `body` | required, 1–500 chars |
| `answer` | optional/null, ≤ 1000 chars when set |
| `status` | enum: `pending` \| `answered` \| `ignored` (default `pending`) |
| `visibility` *(bonus)* | enum: `public` \| `private` (default `public`) |

## Endpoint schemas

**`POST /api/auth/signup`**
`{ username (user rules), email, password (min 8), displayName }` — all required.

**`POST /api/auth/login`**
`{ email, password }` — both required.

**`PATCH /api/users/me`**
Any subset of `{ displayName, bio, avatarUrl, acceptingQuestions, tags }`. **At least one field** must be present (empty object → 400). Unknown fields should be silently dropped (`.passthrough()` + whitelist in controller) — do **not** 400 on `username`/`email` being passed.

**`POST /api/users/:username/questions`**
`{ body }` — required, 1–500.

**`POST /api/questions/:id/answer`**
`{ answer (1–1000), visibility? }`.

**`PATCH /api/questions/:id`**
Any of `{ answer (1–1000), status (enum), visibility (enum) }`. At least one required.

## Why `.passthrough()` on the profile schema?

With `.strict()`, a client sending `{ username: "...", displayName: "..." }` would 400 because `username` is "unknown". We want to **ignore** immutable fields, not reject them. `.passthrough()` lets them through the schema; the controller only applies the whitelisted keys.
