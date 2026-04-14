# Whisper demo frontend

Static MPA served by `express.static('public')`. Uses Tailwind CDN + DaisyUI for styling; `data-theme="dark"` on every page.

## Pages

- `/` — landing, jump to a user
- `/signup.html`, `/login.html` — auth; token stored in `localStorage` as `whisper_token`
- `/feed.html` — global feed; `?tag=xxx` filter
- `/inbox.html` — owner's questions; answer / ignore / toggle visibility / delete
- `/profile.html` — edit display name, bio, avatar, tags, accepting toggle
- `/user.html?u=USERNAME` — public user page: bio, tags, anonymous ask form, public answered feed

## Shared

`app.js` — `api()` wrapper, token/user in `localStorage`, `renderNav()`, `requireAuth()`.
