# Whisper — Anonymous Q&A

A minimalist anonymous Q&A app (think ask.fm / ngl). Users sign up, share their public profile link `/u/:username`, and receive anonymous questions they can answer publicly.

This project is a take-home assignment. The `tester/` directory is the grading contract — when `npm run test:api` is green against your deployed URL, you're done. Bonus tests unlock extra credit.

---

## Stack

- **Node.js 20+** (ESM — `"type": "module"`)
- **Express 5**
- **MongoDB + Mongoose**
- **jsonwebtoken** (stateless JWT auth) + **bcryptjs**
- **zod** (input validation)
- **dotenv** (local dev only)
- **cors**, **morgan**
- **Deployment target: Deno Deploy** (Node compat)

---

## Setup (local)

```bash
cp .env.example .env     # then edit values
npm install
npm start                # node server.js
npm run dev              # node --watch server.js
npm run test:api                          # tester against http://localhost:3000
npm run test:api -- https://my-app.deno.dev   # tester against deployed URL
```

### Environment variables

| Key              | Purpose                                       | Example                |
| ---------------- | --------------------------------------------- | ---------------------- |
| `PORT`           | HTTP port                                     | `3000`                 |
| `MONGODB_URI`    | MongoDB connection string (Atlas recommended) | `mongodb+srv://...`    |
| `JWT_SECRET`     | Secret for signing tokens                     | any long random string |
| `JWT_EXPIRES_IN` | Token lifetime                                | `7d`                   |

---

## Data Model

### User

| Field                     | Type       | Constraints                                                             |
| ------------------------- | ---------- | ----------------------------------------------------------------------- |
| `username`                | String     | required, unique, 3–20 chars, `^[a-zA-Z0-9_]+$`, immutable after signup |
| `email`                   | String     | required, unique, lowercased, valid email                               |
| `passwordHash`            | String     | required, never returned in any response                                |
| `displayName`             | String     | required, 1–50 chars                                                    |
| `bio`                     | String     | optional, ≤ 200 chars                                                   |
| `avatarUrl`               | String     | optional, valid URL (no file upload)                                    |
| `acceptingQuestions`      | Boolean    | default `true`                                                          |
| `tags`                    | `[String]` | 0–10 items; each 2–20 chars, `^[a-z0-9-]+$` (slug format)               |
| `createdAt` / `updatedAt` | Date       | auto (`{ timestamps: true }`)                                           |

**Public projection** (anyone): `{ id, username, displayName, bio, avatarUrl, acceptingQuestions, tags, createdAt }`
**Private projection** (owner only): public + `{ email, updatedAt }`

`passwordHash` must never appear in any response. Use a `toJSON` transform in the schema:

```js
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});
```

For public endpoints, additionally omit `email` (use `.select('-email -passwordHash')` on the query).

### Question

| Field                     | Type            | Constraints                                                                                  |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `recipient`               | ObjectId → User | required, indexed                                                                            |
| `body`                    | String          | required, 1–500 chars                                                                        |
| `answer`                  | String \| null  | ≤ 1000 chars when present; default `null`                                                    |
| `answeredAt`              | Date \| null    | set when answer is added                                                                     |
| `status`                  | Enum            | `'pending' \| 'answered' \| 'ignored'`, default `'pending'`                                  |
| `visibility` _(bonus)_    | Enum            | `'public' \| 'private'`, default `'public'`; private answers excluded from both public feeds |
| `createdAt` / `updatedAt` | Date            | auto                                                                                         |

**No sender fields.** Questions are anonymous. Do not store IP, user-agent, or any identifier on the `Question` document.

**Indexes:**

- `{ recipient: 1, status: 1, createdAt: -1 }` — inbox listing
- `{ status: 1, answeredAt: -1 }` — global feed (answered, newest first)

### RateLimitHit _(bonus — for Mongo-backed rate limiting)_

| Field         | Type   | Notes                                                                  |
| ------------- | ------ | ---------------------------------------------------------------------- |
| `key`         | String | e.g., `ip:1.2.3.4` or `ip:1.2.3.4:username:alice`                      |
| `windowStart` | Date   | truncated to window (e.g., start of hour); TTL index expires after ~1h |
| `count`       | Number | incremented on each hit                                                |

Indexes: `{ key: 1, windowStart: 1 }` unique; TTL on `windowStart` (`expireAfterSeconds: 3600`).

---

## API Reference

All routes are prefixed with `/api`. All bodies are JSON. All timestamps are ISO-8601 strings.

### Auth

#### `POST /api/auth/signup`

Public.

**Request**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "hunter2aB!",
  "displayName": "Alice"
}
```

**Response `201`**

```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com",
    "displayName": "Alice",
    "bio": "",
    "acceptingQuestions": true,
    "tags": [],
    "createdAt": "..."
  }
}
```

**Errors** — `400` validation · `409` duplicate email or username.

#### `POST /api/auth/login`

Public.

**Request** — `{ email, password }`.
**Response `200`** — `{ token, user }` (private projection).
**Errors** — `400` validation · `401` invalid credentials.

#### `GET /api/auth/me`

Auth required.

**Response `200`** — private user projection.
**Errors** — `401` missing or invalid token.

---

### Profile

#### `GET /api/users/:username`

Public.

**Response `200`** — public projection.
**Errors** — `404` not found.

#### `PATCH /api/users/me`

Auth required. All fields optional; only provided fields are updated.

**Request**

```json
{
  "displayName": "Alice New",
  "bio": "I love cats",
  "avatarUrl": "https://example.com/a.png",
  "acceptingQuestions": false,
  "tags": ["coding", "music"]
}
```

**Response `200`** — updated private projection.
**Errors** — `400` validation · `401` missing token.

> `username` and `email` are immutable through this endpoint. Any other field passed in the body is ignored.

---

### Send Question (public)

#### `POST /api/users/:username/questions`

Public, no auth.

**Request** — `{ "body": "What's your favorite language?" }`

**Response `201`**

```json
{ "id": "...", "body": "...", "status": "pending", "createdAt": "..." }
```

Response MUST NOT include `recipient`, `answer`, or anything identifying the sender.

**Errors** — `400` invalid body · `404` unknown recipient · `403` recipient's `acceptingQuestions` is `false` · `429` rate limited _(bonus)_.

---

### Inbox (owner-only)

#### `GET /api/questions/inbox`

Auth required. Returns only questions where `recipient` equals the authenticated user.

**Query parameters**

- `status` — `pending` | `answered` | `ignored` (optional; omit for all)
- `page` — integer ≥ 1 (default `1`)
- `limit` — integer 1–50 (default `20`)

**Response `200`**

```json
{
  "data": [
    {
      "id": "...",
      "body": "...",
      "answer": null,
      "status": "pending",
      "createdAt": "...",
      "answeredAt": null
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

**Errors** — `401` missing token.

#### `POST /api/questions/:id/answer`

Auth required. Owner-only.

**Request** — `{ "answer": "I like TypeScript." }` · _(bonus)_ optionally `"visibility": "private"`.

**Response `200`** — updated question with `answer`, `answeredAt`, `status: "answered"`.

**Errors** — `400` empty/too-long answer · `401` · `403`/`404` not the recipient.

#### `PATCH /api/questions/:id`

Auth required. Owner-only. Update `status` and/or `answer` and/or `visibility` _(bonus)_.

**Request** (at least one field)

```json
{ "status": "ignored" }
```

**Response `200`** — updated question.

**Errors** — `400` · `401` · `403`/`404`.

#### `DELETE /api/questions/:id`

Auth required. Owner-only. Hard delete.

**Response `200` or `204`** (tester accepts either).
**Errors** — `401` · `403`/`404`.

---

### Public Per-User Feed

#### `GET /api/users/:username/questions`

Public. Lists a user's **answered** questions.

**Query parameters** — `page`, `limit` (same as inbox).

**Response `200`**

```json
{
  "data": [
    {
      "id": "...",
      "body": "...",
      "answer": "...",
      "answeredAt": "...",
      "status": "answered"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 8,
  "totalPages": 1
}
```

- Only `status: 'answered'` questions appear.
- Sorted by `answeredAt` DESC.
- `recipient` is NOT included in items (the username is already in the URL).
- Bonus: `visibility: 'private'` questions are excluded.

**Errors** — `404` unknown user.

---

### Global Feed

#### `GET /api/feed`

Public. Site-wide answered questions.

**Query parameters**

- `tag` — if provided, filters to users whose profile `tags` array contains this tag.
- `page`, `limit` (same as above).

**Response `200`**

```json
{
  "data": [
    {
      "id": "...",
      "body": "...",
      "answer": "...",
      "answeredAt": "...",
      "recipient": {
        "username": "alice",
        "displayName": "Alice",
        "avatarUrl": "...",
        "tags": ["coding"]
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 128,
  "totalPages": 7
}
```

- Only answered questions appear.
- Sorted by `answeredAt` DESC.
- Bonus: private answers excluded.
- `recipient` is a minimal public projection — never includes `email` or `passwordHash`.

Implementation hint: when `?tag=` is given, first find user IDs whose `tags` match, then query questions `{ recipient: { $in: ids }, status: 'answered' }`. Or use Mongoose `populate()` and filter after.

---

## Authorization Rules

| Action                                           | Who                                                  |
| ------------------------------------------------ | ---------------------------------------------------- |
| Sign up / log in                                 | Anyone                                               |
| View public profile / public feeds / global feed | Anyone                                               |
| Send anonymous question                          | Anyone (if recipient's `acceptingQuestions` is true) |
| Read inbox, answer, update, delete a question    | Recipient only                                       |
| Update own profile                               | Self only                                            |

A valid JWT (`Authorization: Bearer <token>`) is required for every owner-only action. For cross-user attempts on owner-only endpoints, return **`403 Forbidden`** when the resource exists but belongs to someone else. Returning `404` is also acceptable (don't leak existence) — the tester accepts either.

---

## Response Conventions

**Success** — return the resource directly, or `{ data, page, limit, total, totalPages }` for lists.

**Error** — JSON `{ "error": { "message": "...", "details": [...]? } }`. The tester asserts on status codes only, not error shape, so pick a consistent shape and stick to it.

**Never return**

- `passwordHash` in any response.
- `email` in public (non-owner) responses.
- `recipient` or any sender identifier on `POST /api/users/:username/questions`.

**CORS** — enable `cors()` globally.

---

## Validation (Zod)

Every POST / PATCH has a schema in `validations/`. Apply via a reusable middleware:

```js
// middleware/validate.js
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: { message: "Validation failed", details: result.error.issues },
    });
  }
  req.body = result.data;
  next();
};
```

Schema constraints match the data model above (e.g., `body.min(1).max(500)`, tag slug regex, etc.).

---

## Folder Structure

```
whisper/
├── README.md                    ← this spec
├── package.json                 ← deps + scripts
├── .env.example                 ← template
├── .env                         ← gitignored, local only
├── .gitignore
├── server.js                    ← entry: dotenv → connectDB() → middleware → routes → notFound → errorHandler → listen
│
├── config/
│   └── db.js                    ← cached mongoose.connect (see Serverless section)
│
├── models/
│   ├── User.js                  ← schema, bcrypt pre-save hook, comparePassword method, toJSON transform
│   ├── Question.js              ← schema + indexes
│   └── RateLimitHit.js          ← bonus: TTL-indexed hits collection
│
├── middleware/
│   ├── auth.js                  ← verifies Bearer JWT → populates req.user
│   ├── validate.js              ← validate(schema) factory (Zod)
│   ├── rateLimit.js             ← bonus: Mongo-backed limiter for anon sends
│   ├── notFound.js              ← 404 for unmatched routes
│   └── errorHandler.js          ← (err, req, res, next) → JSON envelope
│
├── validations/
│   ├── authSchema.js            ← signupSchema, loginSchema
│   ├── userSchema.js            ← profileUpdateSchema (incl. tags)
│   └── questionSchema.js        ← createQuestionSchema, answerSchema, updateQuestionSchema
│
├── controllers/
│   ├── authController.js        ← signup, login, me
│   ├── userController.js        ← getPublicProfile, updateMe
│   ├── questionController.js    ← sendQuestion, listInbox, answer, updateQuestion, removeQuestion, listPublicFeed
│   └── feedController.js        ← listGlobalFeed
│
├── routes/
│   ├── authRoutes.js            ← /api/auth/*
│   ├── userRoutes.js            ← /api/users/* (incl. nested /:username/questions public routes)
│   ├── questionRoutes.js        ← /api/questions/* (inbox + owner actions)
│   └── feedRoutes.js            ← /api/feed
│
└── tester/                      ← black-box HTTP tester (see tester/README.md)
    ├── package.json             ← "test": "node run.js", no runtime deps
    ├── README.md
    ├── run.js                   ← parses argv[2] as URL, spawns `node --test tests/`
    ├── helpers.js               ← api(), signup(), sendQuestion(), randomUser()
    └── tests/
        ├── auth.test.js              (required)
        ├── profile.test.js           (required — incl. tags)
        ├── send-question.test.js     (required)
        ├── inbox.test.js             (required)
        ├── answer.test.js            (required)
        ├── public-feed.test.js       (required — per-user)
        ├── global-feed.test.js       (required — /api/feed with ?tag=)
        ├── edge.test.js              (required — 404, bad JWT)
        ├── bonus-rate-limit.test.js  (optional bonus)
        └── bonus-private.test.js     (optional bonus)
```

### Layout conventions

- **Thin `server.js`** — wiring only, no business logic.
- **Route files have zero logic** — they import a controller, apply middleware, mount paths.
- **Controllers call Mongoose directly** — no repository layer.
- **Middleware is reusable** — `auth`, `validate`, `rateLimit`, `notFound`, `errorHandler`.
- **Validation schemas live in `validations/`** — separate from controllers.

### Why questions have two routers

| Path                                  | Router              | Reason                                       |
| ------------------------------------- | ------------------- | -------------------------------------------- |
| `POST /api/users/:username/questions` | `userRoutes.js`     | User-centric URL (matches profile URL shape) |
| `GET /api/users/:username/questions`  | `userRoutes.js`     | Same — lives next to the profile             |
| `GET /api/questions/inbox`            | `questionRoutes.js` | Owner-scoped (no username in URL)            |
| `POST /api/questions/:id/answer`      | `questionRoutes.js` | Resource-centric                             |
| `PATCH /api/questions/:id`            | `questionRoutes.js` | Resource-centric                             |
| `DELETE /api/questions/:id`           | `questionRoutes.js` | Resource-centric                             |

---

## Milestones

1. **Skeleton** — Express + `connectDB()` + CORS + JSON parser + 404 + error handler + `app.listen`.
2. **Auth** — User model (bcrypt pre-save, `toJSON` strips hash, `comparePassword`), `signup` / `login` / `me`.
3. **Profile** — `GET /api/users/:username` (public), `PATCH /api/users/me` (auth) with tags.
4. **Send question** — `POST /api/users/:username/questions` (public, no auth).
5. **Inbox** — `GET /api/questions/inbox` with `status` filter + pagination.
6. **Answer / update / delete** — owner verbs with authz checks.
7. **Per-user public feed** — `GET /api/users/:username/questions` (answered only, newest first).
8. **Global feed** — `GET /api/feed` with `?tag=` filter.
9. **Validation** — Zod schemas on every POST/PATCH route.
10. **Tester green (local)** — `npm run test:api` passes all required tests against `http://localhost:3000`.
11. **Deploy + tester green against deployed URL**.
12. _(Bonus)_ — Rate limiting and/or private answers; bonus tests pass.

---

## Serverless / Deno Deploy Deployment

Deno Deploy runs Node apps through its Node compatibility layer (`npm:` specifiers, `node:` builtins, `process.env`). Students write **plain Node + Express** — no Deno-specific APIs, no `deno.json`.

### Deployment steps

1. Push the repo to GitHub.
2. Create a new project on Deno Deploy, link to the GitHub repo.
3. Set entrypoint to `server.js`.
4. In Deno Deploy's dashboard, set environment variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`. (`PORT` is assigned by the platform.)
5. Deploy.

### Mandatory: cached Mongoose connection

On serverless/edge runtimes, naive `mongoose.connect()` calls create a new connection on every cold start, quickly exhausting Atlas's connection pool. Cache the connection at module scope so it survives across invocations in the same isolate:

```js
// config/db.js
import mongoose from "mongoose";

let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

Call `await connectDB()` in `server.js` before `app.listen()`.

### Constraints to remember

- **No filesystem writes** — don't write logs to disk; use `console.log` / `morgan` → stdout.
- **No long-running background jobs** — everything happens during the request cycle.
- **MongoDB Atlas** is the recommended database (works over outbound TCP).
- **Rate limiter must be Mongo-backed** — in-memory stores (the default in `express-rate-limit`) don't share state across isolates. This is exactly why we defined the `RateLimitHit` model.
- **JWT is stateless** — no session store needed.

If Deno Deploy misbehaves with any dependency, the app also runs on Railway / Render / fly.io / Vercel (anything Node-compatible).

---

## Running the Tester

The tester is a Node `node:test` suite that hits a running API over HTTP. It lives in `tester/` and has zero runtime dependencies — just built-in `fetch` and `node:test`.

The target URL is passed as a **positional argument**. If omitted, the tester defaults to `http://localhost:3000`.

```bash
# against local (default)
npm run test:api

# against deployed
npm run test:api -- https://whisper-alice.deno.dev

# or directly
node tester/run.js https://whisper-alice.deno.dev
```

Under the hood, `tester/run.js` parses `process.argv[2]`, sets `BASE_URL` on the environment, then spawns `node --test tests/` as a subprocess. The test helpers read the URL from `process.env.BASE_URL`.

The tester creates fresh users/questions each run (randomized usernames and emails), so it's safe to re-run against the same deployment. It asserts only on status codes and required response fields — internal error-message shape is up to you.

Required tests must pass for a passing grade. Bonus tests (`bonus-*.test.js`) unlock extra credit but don't affect the base grade.

---

## Bonus Features (optional)

Each bonus feature has its own test file. Implementing all of them is not expected.

### 1. Rate limiting on anonymous sends

- Apply a Mongo-backed limiter to `POST /api/users/:username/questions`.
- Suggested policy: **10 requests per IP per hour per recipient**.
- Use the `RateLimitHit` model; upsert a document keyed by `{ip, username, hourBucket}` and reject when `count` exceeds the limit.
- Respond with `429 Too Many Requests` after the limit is hit.
- Test: `bonus-rate-limit.test.js` fires 11 sends and asserts the last is `429`.

### 2. Private answers

- `POST /api/questions/:id/answer` and `PATCH /api/questions/:id` accept `visibility: 'public' | 'private'` (default `public`).
- Private answers MUST NOT appear in `GET /api/users/:username/questions` or `GET /api/feed`.
- The owner still sees them in their inbox with `status: 'answered'`.
- Test: `bonus-private.test.js` answers with `visibility: 'private'` and asserts exclusion from both feeds.

---

## Submission

1. Push your code to GitHub.
2. Deploy to Deno Deploy (or alternative).
3. Run the tester against the deployed URL with `npm run test:api -- <your-url>` and take a screenshot of the green output.
4. Submit: GitHub repo URL + deployed URL + screenshot.
