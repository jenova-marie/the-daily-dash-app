# Automations — Architecture Spec

**Architecture area:** `AUTO` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 25 · Described 3 · Partial 0

**Sources owned:** `base44/workflows/Daily Auto-Sync.jsonc`, `base44/workflows/Initialize Collage Images for All Users.jsonc`, `base44/workflows/Midnight Daily Quote Generator.jsonc`, `base44/workflows/Sync App Events to Google Calendar (Create).jsonc`, `base44/workflows/Sync App Events to Google Calendar (Update).jsonc`, `base44/workflows/Sync App Events to Google Calendar (Delete).jsonc`
**Sources referenced (owned elsewhere):** the invoked functions → `google-sync.md` §A and `admin-operations.md` §A; `src/pages/Settings.jsx` (sync times UI) → `20-features/settings`; `src/components/Layout.jsx`, `src/pages/AcceptTerms.jsx` (client-side triggers) → `20-features/app-shell`

**Permissions:** workflows are platform-owned; the functions they invoke apply their own checks (see each entry)

## 1. Purpose

Six workflow definitions exist. Three run on a clock and give every account something ready before the day starts (a fresh quote, seed vision-board images, refreshed Google data). Three fire on `ScheduleItem` entity events and keep app-authored blocks mirrored to Google Calendar without the user pressing anything. Each workflow is a single step that invokes one backend function. `[Implemented]` `base44/workflows/*.jsonc` (`definition.do[0].run_function.call == "invoke_backend_function"` in each)

- **AR-AUTO-01** Every workflow carries `x-base44-migrated-from-automation.legacy_payload_function` naming the same function it invokes, recording its origin as an earlier "automation". `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:41-43` and the same block in the other five files
- **AR-AUTO-02** Every trigger step ends the workflow (`"then": "end"`); there is no chaining, branching, retry or notification step. `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:36` (and the same line in each file)

## 2. Scheduled workflows

All three use `trigger_type: "scheduled"`, `schedule_mode: "recurring"`, `timezone: "UTC"`, `ends_type: "never"`, no interval fields, and an empty `args` object. `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:4-19,34`, `…Initialize Collage Images for All Users.jsonc:4-19,34`, `…Midnight Daily Quote Generator.jsonc:4-19,34`

| # | Workflow name | Cron (UTC) | Stated local intent | Function | What the user gets |
|---|---|---|---|---|---|
| 1 | Midnight Daily Quote Generator | `0 7 * * *` | "Generates a new daily quote for all users at midnight Pacific time (07:00 UTC)" | `generateDailyQuotes` | Today's quote already exists when the dashboard opens |
| 2 | Initialize Collage Images for All Users | `0 10 * * *` | none (description empty) | `initializeDefaultCollageImages` | A vision board that is not empty |
| 3 | Daily Auto-Sync | `0 12 * * *` | none (description empty) | `autoSync` | Google Calendar and Google Tasks refreshed once a day |

### 2a. Midnight Daily Quote Generator

- **AR-AUTO-03** Trigger `0 7 * * *` UTC; invokes `generateDailyQuotes` with no arguments; description as quoted above. `[Implemented]` `base44/workflows/Midnight Daily Quote Generator.jsonc:2-3,10,33-34`
- **AR-AUTO-04** The function refuses any caller whose `role` is not `admin` (403 "Forbidden"), on the stated basis that "the platform runs this with the app owner's (admin) user context". `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:10-18`
- **AR-AUTO-05** For every `User`, if a `DailyQuote` already exists for today's date the user is skipped; otherwise one is created with `created_by` set to that user. "Today" is `toLocaleDateString('en-CA')` on the server (UTC). `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:20-34,80-89` (D-213)
- **AR-AUTO-06** The dashboard widget first reads `DailyQuote` for the device's date and invokes `fetchDailyQuote` only when no row exists; the Quotes page invokes `fetchDailyQuote` for the device's date on every load, and the function returns the pre-generated row when present. The scheduled run therefore removes the on-open wait for users whose local date matches the UTC date at generation time. `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:34-44`, `src/pages/Quotes.jsx:71`, `base44/functions/fetchDailyQuote/entry.ts:10,20-28`
- **AR-AUTO-07** User Manual: "Each day, an AI-generated motivational quote is displayed automatically." `[Described]` `src/pages/UserManual.jsx:330`
- Function detail: `admin-operations.md` §2.1.

### 2b. Initialize Collage Images for All Users

- **AR-AUTO-08** Trigger `0 10 * * *` UTC; invokes `initializeDefaultCollageImages` with no arguments. `[Implemented]` `base44/workflows/Initialize Collage Images for All Users.jsonc:10,33-34`
- **AR-AUTO-09** The function acts on the **calling** identity only: it checks whether the caller has any `CollageImage`, and if not copies every `is_default: true` image (read with the service role) into the caller's account. It does not iterate users. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-45` (D-223)
- **AR-AUTO-10** The same function is also invoked client-side on every app-shell mount and once on terms acceptance, which is where a new user's board is seeded in practice. `[Implemented]` `src/components/Layout.jsx:47-48`, `src/pages/AcceptTerms.jsx:52-57`
- **AR-AUTO-11** Admin-driven propagation to existing users is a separate, manual function (`backfillDefaultImagesToAllUsers`). `[Implemented]` `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:20-53`
- Function detail: `admin-operations.md` §2.5.

### 2c. Daily Auto-Sync

- **AR-AUTO-12** Trigger `0 12 * * *` UTC; invokes `autoSync` with no arguments. `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10,33-34`
- **AR-AUTO-13** The function reads the calling identity's `ThemeSettings.sync_sources` (default `["calendar","tasks"]`), that identity's selected calendars, and that identity's Google connectors; it writes that identity's schedule items and tasks. `[Implemented]` `base44/functions/autoSync/entry.ts:8-18,25-26,115` (D-224)
- **AR-AUTO-14** Interaction with settings: `sync_sources` is honoured; `auto_sync_calendar_ids`, `sync_times` and `SelectedTaskLists.is_selected` are not read. Settings labels the card "Auto-Sync Schedule" with the copy "Syncs run automatically at these times each day." beneath a list of user-added times. `[Implemented]` `base44/functions/autoSync/entry.ts:14-26,125`, `src/pages/Settings.jsx:902-983` (D-204)
- **AR-AUTO-15** The scheduled import's window, field set and lack of deletion pass differ from the manual import; see `google-sync.md` §4b and D-201/D-202/D-203.
- **AR-AUTO-16** User Manual: "Set Auto-Sync times to have the app sync automatically at specific times each day." `[Described]` `src/pages/UserManual.jsx:422`; sign-up copy: "Sync Google Calendar events and Google Tasks automatically on app load." `[Described]` `src/pages/Auth.jsx:314` (D-217)
- Function detail: `google-sync.md` §A.

## 3. Entity-triggered workflows

All three use `trigger_type: "entity"` on `entity_name: "ScheduleItem"` and invoke `syncAppEventToGoogle`. `[Implemented]` `base44/workflows/Sync App Events to Google Calendar (Create).jsonc:7-12,26`, `(Update).jsonc:7-12,26`, `(Delete).jsonc:7-12,26`

| # | Workflow name | Event | Condition | Arguments | What the user gets |
|---|---|---|---|---|---|
| 4 | Sync App Events to Google Calendar (Create) | `create` | `.trigger.data.source_type == "custom"` | `event: {{data}}`, `eventAction: "create"` | A custom block placed on the Daily Schedule appears on Google Calendar and the row learns its Google ids |
| 5 | Sync App Events to Google Calendar (Update) | `update` | `.trigger.data.source_type == "custom"` and `.trigger.data.google_event_id != null` | `event: {{data}}`, `eventAction: "update"` | Edits to a pushed block (times, title, notes) reach Google |
| 6 | Sync App Events to Google Calendar (Delete) | `delete` | `.trigger.old_data.source_type == "custom"` and `.trigger.old_data.google_event_id != null` | `event: {{old_data}}`, `eventAction: "delete"` | Removing a pushed block removes the Google event |

- **AR-AUTO-17** Create condition and arguments. `[Implemented]` `base44/workflows/Sync App Events to Google Calendar (Create).jsonc:5,27-30`
- **AR-AUTO-18** Update condition and arguments. `[Implemented]` `base44/workflows/Sync App Events to Google Calendar (Update).jsonc:5,27-30`
- **AR-AUTO-19** Delete condition uses the pre-delete snapshot (`old_data`) so the Google id is still available. `[Implemented]` `base44/workflows/Sync App Events to Google Calendar (Delete).jsonc:5,27-30`
- **AR-AUTO-20** Anti-loop: only `custom` rows match; imported `calendar` rows and Calendar-page `event` rows never fire a workflow. `[Implemented]` all three `:5` (see `google-sync.md` AR-SYNC-21, D-218)
- **AR-AUTO-21** Because the update workflow fires on **any** `ScheduleItem` update where the condition holds, setting `hidden_from_grid`, `hidden_from_todo`, `completed`, or "Move to now" on a pushed custom block also sends a PATCH carrying the row's current title, times and notes. `[Implemented]` `base44/workflows/Sync App Events to Google Calendar (Update).jsonc:5-9`, `base44/functions/syncAppEventToGoogle/entry.ts:64-97`
- **AR-AUTO-22** The dismissal action "Send to Item Library" on a custom block deletes the row and therefore fires the delete workflow when the row had been pushed. `[Implemented]` `src/components/DailyToDo.jsx:166-169`, `(Delete).jsonc:5`
- **AR-AUTO-23** The function called by these workflows requires an authenticated user and the caller's Google Calendar connector; it accepts the arguments either under `args` (workflow shape) or bare (UI shape). `[Implemented]` `base44/functions/syncAppEventToGoogle/entry.ts:5-21`

## 4. Client-side recurring triggers (not workflows)

Recorded here so the full set of "things that run without an explicit user action" is in one place.

| Trigger | When | Function | Citation |
|---|---|---|---|
| App shell mount | every time the authenticated layout mounts | `initializeDefaultCollageImages` (failures ignored) | `src/components/Layout.jsx:47-48` |
| Terms acceptance | once, on "Continue" | `initializeDefaultCollageImages` | `src/pages/AcceptTerms.jsx:52-57` |
| Dashboard quote widget / Quotes page load | on open, when no local row for today | `fetchDailyQuote { date, force: false }` | `src/components/dashboard/DashboardQuote.jsx:44`, `src/pages/Quotes.jsx:71` |

`[Implemented]` for each row as cited. No client timer re-runs a Google sync.

## 5. Timing summary

| UTC | US Pacific (PDT / PST) | Workflow |
|---|---|---|
| 07:00 | 00:00 / 23:00 previous day | Midnight Daily Quote Generator |
| 10:00 | 03:00 / 02:00 | Initialize Collage Images for All Users |
| 12:00 | 05:00 / 04:00 | Daily Auto-Sync |

`[Implemented]` cron fields as cited in §2; the Pacific mapping follows the quote workflow's own description (`base44/workflows/Midnight Daily Quote Generator.jsonc:3`).

## 6. Discrepancies & open questions

- **D-204** (logged in `google-sync.md`) Per-user `sync_times` versus the single `0 12 * * *` cron.
- **D-213** The quote workflow describes "midnight Pacific time (07:00 UTC)" (`base44/workflows/Midnight Daily Quote Generator.jsonc:3`); the function stamps the quote with the UTC calendar date (`base44/functions/generateDailyQuotes/entry.ts:20`), while the client fetches by the device's local date (`src/components/dashboard/DashboardQuote.jsx:44`, `src/pages/Quotes.jsx:71`).
- **D-223** The workflow is named "Initialize Collage Images for All Users" (`base44/workflows/Initialize Collage Images for All Users.jsonc:2`); the function it invokes seeds only the calling identity (`base44/functions/initializeDefaultCollageImages/entry.ts:13-17,38`), whereas `generateDailyQuotes` iterates all users under the same scheduled model (`base44/functions/generateDailyQuotes/entry.ts:23-28`).
- **D-224** "Daily Auto-Sync" invokes `autoSync` once with no arguments (`base44/workflows/Daily Auto-Sync.jsonc:33-34`); the function syncs the calling identity's connectors and settings only (`base44/functions/autoSync/entry.ts:8,15,25-26`).
- **Q-204** Blocks §2. Under which identity does the platform execute scheduled workflows? The quote function's comment asserts the app owner (`base44/functions/generateDailyQuotes/entry.ts:10-11`); the other two scheduled functions have no such guard.
- **Q-205** Blocks §2c. Is the daily sync intended to fan out per user (with each user's `sync_times`), or to be a single owner-scoped run?
- **Q-208** Blocks §3. Is the PATCH on every update of a pushed custom block (AR-AUTO-21) the intended behaviour, or is the push meant to follow field edits only?
