# Whisper Tester

Black-box HTTP tester. Runs `node --test` against a target URL. Zero runtime deps.

## Usage

```bash
# from project root
npm run test:api                              # default: http://localhost:3000
npm run test:api -- https://app.deno.dev     # against deployed

# or direct
node tester/run.js https://app.deno.dev
```

Target URL is `process.argv[2]`. If omitted, defaults to `http://localhost:3000`.

## Test files

- `tests/*.test.js` — required tests.
- `tests/bonus-*.test.js` — optional bonus (extra credit).

Each run creates fresh users and questions with randomized identifiers, so it's safe to re-run against the same deployment.
