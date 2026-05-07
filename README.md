# agentic-qa-bench

A self-contained **proving-ground / smoke surface** for the [**agentic-qa**](https://github.com/monodev-eth/agentic-qa-skill) skill (and any similar QA-automation skill that drives a real browser).

> **Honest framing:** this is a *target app*, not a benchmark in the rigorous sense. It exercises the agentic-qa workflow end-to-end against a small, reproducible surface, and acts as a regression target when the skill changes. It does **not** include planted defects, expected-discovery lists, or a scoring rubric — without those, "did the skill pass?" is a binary smoke signal, not a measurement that distinguishes good QA from lucky QA. See [§ scope and limits](#scope-and-limits) before judging this as a benchmark.

> **Status:** v0.1.x — self-contained boot. Backend is fully mocked in-process; no Supabase, no Docker, no network. `npm install && npm run dev` and you're running.

Originally derived from the [Supabase Next.js todo example](https://github.com/supabase/supabase/tree/master/examples/todo-list/nextjs-todo-list) (Apache-2.0). The upstream auth widget and live database have been replaced with an in-memory mock so each run is reproducible.

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

## What this is good for

| Use | Fitness |
|-----|---------|
| Verifying an agentic-QA skill's exploration → generation → debug loop runs end-to-end | ✅ good |
| Regression target when iterating on the agentic-qa skill text | ✅ good |
| Reproducible demo that doesn't require external services | ✅ good |
| Comparing two models/skills on QA *quality* | ❌ no — there's no rubric to score against |
| Detecting whether a model writes semantically wrong tests that happen to pass | ❌ no — the mock is intentionally permissive |
| Generalizing to non-Vibium / non-Playwright QA approaches | ❌ no — this surface assumes the agentic-qa workflow shape |

## Surfaces this exercises

| Surface | Capabilities |
|---------|--------------|
| `/` (logged-out) | Login form, input validation, error state on bad creds, pending state during submit |
| `/` (logged-in) | List rendering, optimistic CRUD (add, toggle, delete), logout |

That's it for v0.1.x. The pre-auth and authed surfaces together exercise phases 1–3 of the agentic-qa skill (vibium exploration → Playwright POM/spec generation → test execution + debug).

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

`lib/mockClient.ts` implements the slice of the Supabase JS API the app uses: `auth.{getSession, onAuthStateChange, signInWithPassword, signOut}` and `from('todos').{select, insert, update, delete, eq, order, single, throwOnError}`. Data resets on every page reload — every run starts from the same fixture. Unknown table names throw, and `single()` returns a PGRST116-shaped error on 0 or >1 rows, but otherwise the mock is intentionally lenient.

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

`tests/` contains a hand-written Page Object + spec that mirrors what a successful skill run should produce. The Playwright config starts the dev server itself, so the test command is fully self-contained. Use these as a sanity check that the bench app behaves as expected.

## Switching to real Supabase (optional)

If you want to point this app at a live Supabase project (e.g. to develop against real RLS / realtime):

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
echo 'NEXT_PUBLIC_USE_REAL_SUPABASE=true' >> .env.local
npm run dev
```

You'll need to create a Supabase project and run the "Todo List" SQL quickstart from the [upstream Supabase docs](https://github.com/supabase/supabase/tree/master/examples/todo-list/nextjs-todo-list#readme). This path is **not** the proving-ground mode — it's only useful for live development against the real backend.

## Scope and limits

What this is **not**:

- **Not a benchmark in any rigorous sense.** No planted defects, no expected-discovery list, no scoring rubric, no false-positive accounting. Two skills both producing 4/4 green tests are indistinguishable here.
- **Not a test of QA *quality*.** The mock client passes most semantically-wrong queries silently; the bench grades plumbing, not thinking.
- **Not generalizable across QA approaches.** It assumes the Vibium-driven exploration + Playwright POM workflow that agentic-qa documents. A skill using a different approach (axe, screenshot diffing, Selenium, etc.) is not directly comparable on this surface.

## Future direction (conditional)

A real benchmark would need a `BENCHMARK.md` design artifact specifying scoring categories (exploration coverage, selector quality, bug discovery, test quality, debug-loop use, report quality), a planted-defect inventory, expected-discovery format, and false-positive rules — written **before** any new scenario pages, so pages serve the rubric rather than the reverse.

That's a substantial design + maintenance commitment. Whether to make it is an open question; today this repo is closed out at v0.1.x as a clean proving-ground artifact, not a partial benchmark.

## License

This repo retains the upstream Apache-2.0 license. See [LICENSE](./LICENSE).
