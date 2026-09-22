# The Daily Dash API — foundation and My Day MVP — design

**Date:** 2026-09-22 · **Status:** approved in conversation, awaiting written review · **Package:** `apps/api`

## 1. Purpose and scope

A new HTTP API in this pnpm monorepo that will eventually host the full Daily Dash backend, built so that its
first consumer is **My Day**, the feature inside the RecoverySky app described in
[`docs/recoverysky-vision.doc.md`](../../recoverysky-vision.doc.md). The full Daily Dash app later uses the same
API and the same accounts.

**In scope for this build**

- The package, tooling, CI and test harness (unit, integration against local Supabase, RLS isolation, contract
  and coverage gates).
- The data model for My Day as a strict subset of the Daily Dash entities, with row-level security.
- Supabase Auth as the identity provider, plus the Auth0 → Supabase token exchange for RecoverySky users.
- The My Day MVP contract: profile, today, routine, check-in, pillars, week look-back, word for today,
  affirmations.

**Out of scope for this build** (each gets its own spec later)

- The assistant. Section 8 records what My Day needs from one; it is built elsewhere.
- v2 and v3 of My Day (Todays three / tasks, goals, print and email, appointments, sharing).
- The rest of the Daily Dash: schedule hub, chores, education, Google sync, automations, export.
- Deployment and infrastructure beyond a Dockerfile.

**Success criteria.** A RecoverySky user can exchange their Auth0 token, build a routine, tick it through a
day, complete a six-pillar check-in with a gratitude, see focal areas, the word for today and a week look-back —
every step covered by unit and integration tests, with RLS proven by SQL tests, the OpenAPI document checked in,
and the coverage gate passing in CI.

## 2. Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Database | Supabase Postgres with row-level security | The database enforces per-user isolation; the API is defence in depth on top of it, not the only guard. |
| Identity | Supabase Auth issues all tokens | One identity for both apps; RecoverySky users reach it through a token exchange from Auth0. |
| Access path | API only; no app talks to Supabase directly | One place for validation, rules, limits and logs; the OpenAPI contract is what both apps share. |
| Framework | Fastify + zod | Request and response validation and the OpenAPI document come from one set of schemas; `inject()` tests need no port. |
| Schema ownership | SQL migrations run by the Supabase CLI; drizzle only as a typed query builder | RLS, grants, triggers and seed functions are first-class in SQL where Supabase expects them; a drift test keeps drizzle's mirror honest. |
| Logging | `@jenova-marie/wonder-logger` (pino) | House standard across RecoverySky; hashed identifiers only. |
| Results | `@jenova-marie/ts-rust-result` in domain and db code, thrown only at the route boundary | House standard. |
| Package layout | One package, `apps/api`, with `contract/` and `domain/` as folders | Split into `packages/contract` and `packages/domain` when the Expo app needs them; the split is a `git mv`. |
| Assistant | Out of this build | Defined as requirements in section 8; built as a separate service that acts as the user through this API. |

## 3. Package layout and tooling

```
apps/api/
├── package.json              @daily-dash/api, private
├── tsconfig.json             ESM, NodeNext, strict, noUncheckedIndexedAccess
├── vitest.config.ts          unit: src/**/*.test.ts; coverage thresholds
├── vitest.int.config.ts      integration: src/**/*.int.test.ts; needs the local Supabase stack
├── Dockerfile
├── wonder-logger.yaml
├── supabase/
│   ├── config.toml           local stack (db, auth; studio off in CI)
│   ├── migrations/           numbered SQL: tables, triggers, RLS, grants, seed functions
│   ├── seed.sql              local development data only
│   └── tests/                pgTAP RLS isolation tests (*.sql)
├── openapi/openapi.json      generated from the zod contract; checked in; diffed in CI
└── src/
    ├── index.ts              boot: config → buildApp → listen
    ├── app.ts                buildApp(deps): Fastify instance, plugins, routes
    ├── config.ts             zod-validated environment
    ├── contract/             zod schemas per resource; OpenAPI registration; error shape
    ├── domain/               pure rules, no I/O
    ├── db/                   drizzle schema mirror, client, withUser(), repositories
    ├── auth/                 Supabase JWT plugin; Auth0 → Supabase exchange
    ├── routes/               one file per resource; parse → domain/repo → reply
    └── test/                 builders, fake repositories, seeded-user helpers, frozen clock
```

- Node 22 LTS, TypeScript 5, pnpm workspace; `tsx` for dev, `tsc` for build; eslint flat config + prettier.
- Root `package.json` scripts fan out with `pnpm -r`: `dev`, `build`, `typecheck`, `lint`, `test`, `test:int`,
  `openapi:check`, `db:reset`.
- Logging: one wonder-logger instance from `wonder-logger.yaml`; a request-scoped child logger per request; no
  raw `sub`, email, token or device id on any line (a 16-hex hash of the user id where a user must be named).
- OpenTelemetry hooks present but off by default (`OTEL_ENABLED=false`).

## 4. Data model and row-level security

Every table is a Daily Dash entity under a Postgres name, so the full app later adds tables rather than renaming
these. Names in parentheses are the entities in [`docs/specs`](../../specs/README.md).

| Table | Entity | Columns beyond the conventions |
|---|---|---|
| `profiles` | User + ThemeSettings subset | `id` = `auth.users.id` (pk), `display_name`, `timezone` IANA not null default `'UTC'`, `assistant_tone` enum `gentle·plain·spiritual` default `plain`, `pillar_set` enum `recovery·daily_dash` default `recovery` |
| `checklist_items` | DailyChecklist | `title`, `bucket` enum `morning·afternoon·evening·anytime`, `time_of_day` time null, `sort_order` int, `is_active` bool default true, `template_key` text null |
| `checklist_completions` | ChecklistCompletion | `item_id` fk, `date`, `completed` bool, `completed_at` timestamptz null; unique `(item_id, date)` |
| `pillars` | HealthPillar | `key` text, `name`, `description`, `sort_order`, `is_active`; unique `(user_id, key)` |
| `pillar_actions` | PillarActivity | `pillar_id` fk, `title`, `source` enum `seed·user·assistant`, `provenance` jsonb null |
| `pillar_ratings` | DailyPillarTracking | `pillar_id` fk, `date`, `rating` smallint 1–5, `note` text null; unique `(pillar_id, date)` |
| `gratitudes` | DailyGratitude | `date`, `entry` text; unique `(user_id, date)` |
| `affirmations` | Affirmation | `pillar_id` fk null, `text`, `source` enum `user·assistant·seed`, `provenance` jsonb null |
| `pillar_seed_sets` | (seed data) | global, read-only: `set_key`, `pillar_key`, `name`, `description`, `sort_order`, `actions` jsonb, `affirmations` jsonb |
| `routine_templates` | (seed data) | global, read-only: `key`, `name`, `items` jsonb |

**Conventions for every per-user table.** `id uuid pk default gen_random_uuid()`; `user_id uuid not null default
auth.uid() references auth.users(id) on delete cascade`; `created_at`/`updated_at timestamptz` maintained by a
trigger. `date` columns hold the user's local calendar day; instants are `timestamptz`. Unique constraints make
the prototype's "one per date by convention" rules real.

**Row-level security.** Enabled on every per-user table with four policies each: `select`, `insert`, `update`,
`delete` for role `authenticated` where `user_id = auth.uid()`. `anon` has no grants. Seed tables grant
`select` to `authenticated` only. A `check_same_user()` trigger on `checklist_completions`, `pillar_actions`,
`pillar_ratings` and `affirmations` rejects a row whose parent belongs to another user. The `service_role` is used
by exactly two code paths: the Auth0 exchange (user lookup and creation) and the test helpers.

**Seeding.** `seed_pillars(user_id, set_key)` copies a set from `pillar_seed_sets` into `pillars` and
`pillar_actions` (recovery: Sleep, Food, Body, Connection, Program, Cravings and mood, three or four actions each;
daily_dash: the thirteen pillars and 65 activities from `docs/specs/…/seed-data.md`). A trigger on
`auth.users` insert creates the profile and seeds the profile's default set. `apply_routine_template(user_id,
key)` inserts a template's items after the user's existing ones.

**Rules that are computed, not stored.** Focal area = `rating <= 3` on the latest check-in; week = Sunday to
Saturday in the profile's timezone; n-of-7 = completions in that week. All live in `domain/`.

**Deletion.** Deleting the Supabase user cascades through every table: the prototype's "delete account" in one
statement.

## 5. Auth and the token exchange

**Two front doors, one identity.**

- *Daily Dash app (later):* signs in with Supabase Auth directly (email + password, Google).
- *RecoverySky app (now):* keeps its Auth0 login and calls `POST /v1/auth/exchange` with its Auth0 access token.

**Exchange.** The API verifies the Auth0 token against the `meetingmaker` tenant's JWKS with `jose` (issuer and
a new Auth0 API audience for My Day), finds or creates the Supabase user whose `app_metadata.auth0_sub` equals
the token's `sub` (service role, admin API; email copied if present), and returns a Supabase session (access and
refresh tokens, expiry). The exchange is idempotent: the same person always lands on the same Supabase user.
`POST /v1/auth/refresh` exchanges a refresh token for a new session so the RS app never needs the Supabase SDK.

**Minting the session** is the one piece Supabase does not offer as a single call for a non-OAuth provider, and
it is the first task of the implementation plan as a time-boxed spike (half a day):

1. Primary: admin `generateLink({ type: 'magiclink' })` followed by server-side `verifyOtp({ token_hash })`,
   which yields a full session without sending mail.
2. Fallback: Supabase's third-party auth setting, so the database accepts the Auth0 token directly. The exchange
   then becomes a pass-through and RLS keys on the Auth0 `sub` instead of `auth.uid()`.

The spike's finding is recorded in this spec before the rest of `auth/` is built.

**Verifying requests.** A Fastify `auth` plugin verifies the Supabase JWT with the project's JWKS (cached),
rejects anything without `role = authenticated`, and decorates the request with `{ userId, claims }`.
`db.withUser(request, fn)` opens a transaction, runs `set local role authenticated` and
`set local request.jwt.claims = <claims json>`, then executes `fn(tx)`, so every drizzle query runs under RLS
exactly as PostgREST would. No code path outside `auth/exchange` and `src/test/` holds the service key.

**Profiles.** Created by the `auth.users` trigger with `timezone = 'UTC'`; the client sends the device timezone
on its first `PATCH /v1/me`.

## 6. API contract — My Day MVP

All routes under `/v1`; JSON; Supabase bearer token on everything except `/auth/*` and ops; zod-validated in and
out; OpenAPI generated from the same schemas. Errors share one shape:
`{ "error": { "code": string, "message": string, "details"?: unknown } }` with codes `validation`,
`unauthorized`, `forbidden`, `not_found`, `conflict`, `limit_reached`, `rate_limited`, `internal`.

| Area | Endpoints | Rules |
|---|---|---|
| Auth | `POST /auth/exchange`, `POST /auth/refresh` | section 5 |
| Me | `GET /me`, `PATCH /me` | `timezone` must be a valid IANA name; `display_name` ≤ 60 chars |
| Today | `GET /today?date=` | one round trip for the home screen: active routine items with the day's ticks, week counts, last check-in's focal areas, today's word. `date` defaults to the profile's local today; future dates rejected. |
| Routine | `GET /routine/items`, `POST /routine/items`, `PATCH /routine/items/:id`, `DELETE /routine/items/:id` (sets `is_active=false`), `PUT /routine/order`, `PUT /routine/items/:id/ticks/:date`, `DELETE /routine/items/:id/ticks/:date`, `GET /routine/templates`, `POST /routine/templates/:key/apply` | ticks are per date; past dates allowed, future rejected; more than 12 active items returns `warnings: ["long_routine"]`, never a refusal; `PUT` ticks are idempotent |
| Check-in | `GET /checkins/:date`, `PUT /checkins/:date`, `DELETE /checkins/:date`, `GET /checkins?from&to` | one per date; a rating for every active pillar, 1–5; optional note per pillar; gratitude optional; editable until local midnight of the following day; response carries `focalAreas` (pillars rated ≤ 3) and `crisis: true` when the `cravings_mood` pillar is rated ≤ 2 |
| Pillars | `GET /pillars`, `PATCH /pillars/:id` (name, sort_order, is_active), `GET /pillars/:id/actions`, `POST /pillars/:id/actions`, `DELETE /pillars/:id/actions/:actionId` | the set is seeded; pillars cannot be created or hard-deleted through the API |
| Week | `GET /weeks/:sunday` | read-only look-back: n-of-7 per item, seven ratings per pillar, gratitudes; `:sunday` must be a Sunday in the profile's timezone |
| Word | `GET /word/today` | deterministic per user per local date: the person's affirmations for the lowest focal area, else the seeded affirmations for it, else a general seeded line; no generation |
| Affirmations | `GET /affirmations`, `POST /affirmations`, `DELETE /affirmations/:id` | `source` defaults to `user`; `assistant` requires `provenance` |
| Ops | `GET /healthz`, `GET /readyz` (db + JWKS reachable), `GET /openapi.json` | unauthenticated |

List endpoints take explicit date windows capped at 92 days; no pagination. Writes keyed by date (`PUT`
check-ins and ticks) are idempotent so mobile retries are safe. Every response includes `X-Request-Id`.

## 7. Testing and CI

| Layer | Tool | Proves | Runs |
|---|---|---|---|
| Unit | vitest | `domain/` rules (focal area, week bounds in the profile's timezone, n-of-7, word selection), `contract/` schemas, route handlers via `app.inject()` with fake repositories | every save; CI |
| Integration | vitest `*.int.test.ts` against the Supabase CLI stack in Docker | real migrations and RLS: every endpoint exercised as two seeded users with real Supabase JWTs; the Auth0 exchange against a stubbed JWKS | `pnpm test:int`; CI |
| RLS isolation | pgTAP in `supabase/tests/` | for every per-user table: user A cannot select, insert, update or delete user B's rows; `check_same_user()` rejects mismatched parents; `anon` gets nothing | with integration |
| Contract | `openapi/openapi.json` | `pnpm openapi:check` fails if the committed file differs from what the code generates | CI |
| Coverage | vitest v8 | 95 % lines on `domain/` and `contract/`, 85 % overall; below threshold fails the build | CI |
| Static | `tsc --noEmit`, eslint, prettier check, drizzle-vs-SQL drift test | — | CI |

**CI** (GitHub Actions, monorepo root): install → static → unit → `supabase start` (Docker layer cached) →
`supabase db reset` → pgTAP → integration → `openapi:check` → coverage report. One `Dockerfile` builds the API
image; deployment is out of scope.

**Test helpers** (`src/test/`): `createUser()` (service role; returns a real JWT), a builder per table,
`asUser(jwt)` for injected requests, and a frozen `clock(tz)` so no test depends on the wall clock or the
machine's timezone.

## 8. Assistant requirements — out of build scope

My Day's assistant is a separate service. It acts as the person, through this API, with the person's own
token; it reads what the API exposes and proposes; the person accepts through the ordinary write endpoints.
The API never holds a model key and never calls the assistant; the client apps do.

| Capability | Input (all available from the API) | Output | Where it lands |
|---|---|---|---|
| Routine draft | answers to three questions (wake and sleep, fixed commitments, what they are taking care of); the templates | up to 12 items in the four buckets, optional times | client shows the draft; on approval `POST /routine/items` |
| Nightly reflection | the saved check-in (`GET /checkins/:date`), the last seven days, the routine ticks | one sentence ≤ 240 chars naming what the person did, plus one action ≤ 120 chars for the lowest pillar | client shows it; on accept, v2's `POST /tasks` |
| Word for today | last night's focal areas, the profile's tone, kept affirmations | one first-person line ≤ 160 chars | client shows it; "keep" calls `POST /affirmations` with `source = assistant` |
| Pillar action ideas | a pillar and its existing actions | three to five small concrete actions | client shows; "add" calls `POST /pillars/:id/actions` |

**Non-negotiable behaviours**

1. Never saves on its own; every persisted line comes from a person's tap through the API.
2. Sees the minimum: ratings, pillar keys, gratitude, routine, tone. Never display name, email, or anything
   outside My Day.
3. Crisis first: honours the API's `crisis: true` on a check-in by putting RecoverySky's crisis path ahead of any
   generated text, and applies its own danger-language check to free text.
4. No clinical role: no diagnosis, medication or dose talk, or treatment advice; says so and points to a person.
5. Tone is the person's — gentle, plain or spiritual from the profile; never preaches a programme.
6. Vocabulary ban in outputs: failed, missed, behind, overdue, streak.
7. Degrades to nothing: when it is unavailable every My Day screen still works; `GET /word/today` is the
   fallback for the word.
8. Provenance on everything it proposes (model, prompt version), stored by the API in `provenance`.
9. Budget: once per touchpoint per person per local day for the word and the reflection; a daily cap overall.

**What this build provides for it:** `source` and `provenance` on `affirmations` and `pillar_actions`; `crisis`
and `focalAreas` on check-in responses; `GET /today` and `GET /weeks/:sunday` as its read surface; the
OpenAPI file from which a typed client can be generated.

## 9. Risks and open points

- **Session minting** (section 5) is unproven until the spike; the fallback changes how RLS identifies the user,
  so the spike runs first.
- **Auth0 audience.** A new API identifier must be created in the `meetingmaker` tenant and added to the
  RecoverySky app's requested audience; owned by the RS team.
- **Timezone on first run.** Until the client sends one, "today" is UTC; `GET /today` returns `timezone` so the
  client can prompt.
- **The `cravings_mood` key** is what the crisis rule keys on; renaming the pillar keeps the key.
