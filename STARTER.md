# Whisper starter (skeleton mode)

Every file you need is present. Functions with unfinished bodies throw:

    throw new Error('not implemented');

Each stub has a `// TODO:` block telling you what to build and where to look in the docs and tester.

## Where to start

1. Read the spec:
   - `docs/API.md` — endpoints, request/response contracts
   - `docs/VALIDATION.md` — exact field rules
   - `docs/GRADING.md` — how the tester works
   - `README.md` — full project brief (stack, data model, auth rules)
2. Set up your environment: `cp .env.example .env` → fill in `MONGODB_URI` and `JWT_SECRET`.
3. Install: `npm install`.
4. Run the server: `npm start` (or `npm run dev` for watch mode).
5. Run the tester: `node tester/run.js http://localhost:3000`.
6. Walk through the TODOs — the tester lights up green as you go.

## Recommended order

1. `config/db.js` — already wired; just confirm it connects.
2. `middleware/errorHandler.js` + `notFound.js` — already complete.
3. `middleware/validate.js` — implement the Zod adapter.
4. `models/User.js` — `comparePassword`, `hashPassword`, `toJSON` transform.
5. `middleware/auth.js` — `signToken`, `authenticate`.
6. Controllers: auth → profile → send-question → inbox → answer → feeds.
7. Bonus: `middleware/rateLimit.js` + `middleware/auth.js` rate-limited send.

## Static frontend (bonus check)

Once your API is green, open `http://localhost:3000/` — the static demo in `public/` lets you experience the app end-to-end.
