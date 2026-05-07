# agentic-qa-bench

A self-contained benchmark target for the [**agentic-qa**](https://github.com/monodev-eth/agentic-qa-skill) skill (and any similar QA-automation skill that drives a real browser).

> **Status:** v0.1 — self-contained boot. Backend is fully mocked in-process; no Supabase, no Docker, no network. `npm install && npm run dev` and you're running.

Originally derived from the [Supabase Next.js todo example](https://github.com/supabase/supabase/tree/master/examples/todo-list/nextjs-todo-list) (Apache-2.0). The upstream auth widget and live database have been replaced with an in-memory mock so the benchmark is reproducible.

## Quick start

```bash
git clone https://github.com/monodev-eth/agentic-qa-bench.git
cd agentic-qa-bench
npm install
npm run dev
```

Open http://localhost:3000. Sign in with the seed credentials shown on the page:

- **Email:** `demo@example.com`
- **Password:** `demo1234`

Two seeded todos appear ("Walk the dog", "Buy groceries"). You can add, toggle, and delete.

## What this benchmarks

The current v0.1 surface exercises **phases 1–3** of the agentic-qa skill:

| Surface | Skill capability tested |
|---------|------------------------|
| `/` (logged-out) | Login form, validation, error state on bad creds, pending state during submit |
| `/` (logged-in) | List rendering, optimistic CRUD (add, toggle, delete), logout |

Future versions will add `/connect` (DB-connect-screen pattern), `/profile` (multi-field form validation), `/upload` (file input), `/todos/dnd` (drag-drop), and a `BENCHMARK.md` scoring rubric. See the [roadmap](#roadmap) below.

## How it works

```
pages/index.tsx
    └── components/LoginForm.tsx ──┐
    └── components/TodoList.tsx ───┤
                                   ▼
                          lib/initSupabase.ts
                                   │
                  ┌────────────────┴───────────────┐
                  ▼                                ▼
         lib/mockClient.ts             @supabase/ssr (real)
       (in-memory, default)         (when NEXT_PUBLIC_USE_REAL_SUPABASE=true)
```

`lib/mockClient.ts` implements the slice of the Supabase JS API the app uses:
`auth.{getSession, onAuthStateChange, signInWithPassword, signOut}` and
`from('todos').{select, insert, update, delete, eq, order, single, throwOnError}`.
Data resets on every page reload — every benchmark run starts from the same fixture.

## Running the agentic-qa skill against this app

After `npm run dev` is up at http://localhost:3000:

```
> /agentic-qa QA the login flow at http://localhost:3000
```

The skill walks through Phase 0 (boot check) → 1 (vibium map) → 2 (POM + spec generation) → 3 (test execution + debug). Reference Playwright tests this skill should produce live in `tests/` — they pass against the current build.

## Reference tests

```bash
npx playwright install chromium  # first time
npx playwright test
```

`tests/` contains a hand-written Page Object + spec that mirrors what a successful skill run should produce. Use these as a sanity check that the bench app behaves as expected.

## Switching to real Supabase (optional)

If you want to point this app at a live Supabase project (e.g. to develop against real RLS / realtime):

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
echo 'NEXT_PUBLIC_USE_REAL_SUPABASE=true' >> .env.local
npm run dev
```

You'll need to create a Supabase project and run the "Todo List" SQL quickstart from the [upstream Supabase docs](https://github.com/supabase/supabase/tree/master/examples/todo-list/nextjs-todo-list#readme). This path is **not** the benchmark mode — it's only useful for live development against the real backend.

## Roadmap

- **v0.1** ✅ Self-contained boot — replace Supabase with in-memory mock; remove auth-ui-react widget; ship a stable login + todo CRUD surface.
- **v0.2** — Add `/connect`, `/profile`, `/upload` scenarios with planted defects. Ship `BENCHMARK.md` + scoring rubric.
- **v0.3** — Add `/todos/dnd` (drag-drop). Add a `score.ts` helper that reads test results and emits a JSON score card.

## License

This repo retains the upstream Apache-2.0 license. See [LICENSE](./LICENSE).
