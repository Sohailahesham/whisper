# Whisper — Grading

The `tester/` directory is the grading harness. Black-box HTTP tests over `fetch`, zero external dependencies beyond Node 20+.

## How to run

```bash
# tester against a local server
node tester/run.js http://localhost:3000

# tester against your deployed URL
node tester/run.js https://your-app.deno.dev
```

There is also `npm run test:api` in `package.json`.

**Target is passed as a positional CLI argument**, not an env var.

## Suites → features

| Suite file | What it checks | Required? |
|---|---|---|
| `tests/edge.test.js` | 404 for unknown `/api` routes, 401 for malformed JWT | required |
| `tests/auth.test.js` | Signup/login/me; token shape; error codes | required |
| `tests/profile.test.js` | Public/private projections, immutable fields, tags | required |
| `tests/send-question.test.js` | Anonymous send; 400/403/404; no sender/recipient leakage | required |
| `tests/inbox.test.js` | Pagination, `?status` filter, auth, ownership | required |
| `tests/answer.test.js` | Answer / PATCH / DELETE; ownership (403/404) | required |
| `tests/public-feed.test.js` | `/api/users/:username/questions` — answered + public only | required |
| `tests/global-feed.test.js` | `/api/feed`, `?tag=` filter, projection | required |
| `tests/bonus-rate-limit.test.js` | 11th send within an hour → 429 | **bonus** |
| `tests/bonus-private.test.js` | `visibility: "private"` hidden from both feeds, visible in owner's inbox | **bonus** |

## What "done" means

- **Pass:** all required suites green.
- **Pass with honors:** all suites green (including both bonus suites).
- Your deployed URL can be used as the target — it's the same tester.

## Tips

- The tester creates its own users per run — no seeding needed.
- Tests run in parallel against `--test`; they don't rely on ordering.
- If a test needs the DB "reset" between runs, you don't need to do that — every test creates fresh users and queries by their ids.
- Rate-limit bonus suite re-creates a fresh recipient each run so the 10-per-hour window doesn't bleed between runs.
