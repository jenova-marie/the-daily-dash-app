# Settings — Sync Configuration (Level 2)

**Feature code:** `SET` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 27 · Described 5 · Partial 7

**Sources owned (this feature's bindings only):** `src/pages/Settings.jsx:230-331,425-556,864-985,1111-1154`
**Sources referenced (owned elsewhere):** `base44/functions/autoSync/entry.ts`, `syncGoogleCalendarToApp/entry.ts`, `syncGoogleTasks/entry.ts`, `getGoogleCalendars/entry.ts`, `getGoogleTaskLists/entry.ts` → `10-architecture/google-sync.md` (§3 is the enforcement table this document cites); `base44/workflows/Daily Auto-Sync.jsonc` → `10-architecture/automations.md` §2c; `base44/entities/ThemeSettings.jsonc`, `SelectedCalendars.jsonc`, `SelectedTaskLists.jsonc` → `10-architecture/data-model/settings.md`, `data-model/sync.md`; `src/pages/CalendarPage.jsx:187-215` → `20-features/calendar`; `src/pages/UserManual.jsx:419-431` → `20-features/user-manual`.

This document is the user-facing model of *what* syncs and *when*: every setting the account owner can change on the Settings page that touches Google sync, where it is set, where it is stored, and which function honours it. Sync mechanics (windows, field mapping, dedup, deletion guards, tombstones) are owned by `google-sync.md` and are cited, not restated.

## 1. The user's mental model

The Settings page presents sync as four decisions, each with its own control `[Implemented]` `src/pages/Settings.jsx:809-983`:

1. **Which services are connected** — Integrations card: Google Calendar and Google Tasks, independently (spec.md §4.4).
2. **Which calendars are imported** — Select Calendars to Sync card: one checkbox per Google calendar (spec.md §4.5).
3. **What a sync covers** — the "What would you like to sync?" dialog: calendar events, tasks, or both (spec.md §4.6).
4. **What runs automatically** — Auto-Sync Schedule card: calendars to auto-sync, task lists to auto-sync, and scheduled times, described by the copy "Syncs run automatically at these times each day." (spec.md §4.7).

The manual frames the same model: "select which calendars to sync" (`src/pages/UserManual.jsx:149`), "Manage Calendars to toggle which calendars to sync" (`:420`), "Set Auto-Sync times to have the app sync automatically at specific times each day." (`:422`), "Connect Google Tasks to sync task lists from Google into the app." (`:429`). `[Described]`

## 2. Setting → where set → stored → who honours it

Each row names the control, the store, and every function that reads the store. "Honoured by" lists only readers that change behaviour on the value; "no reader" means nothing in `base44/functions/`, `base44/workflows/`, or `src/` outside Settings reads the field. Enforcement citations follow `google-sync.md` §3.

| # | Setting (UI label) | Where set | Stored as | Default | Honoured by | Not honoured by | Tag / citation |
|---|---|---|---|---|---|---|---|
| 1 | Google Calendar connected (**Connect** / **Connected**) | Integrations card | platform connector `69e73980123bb49cf43baf96` (no entity row) | not connected | manual calendar import, scheduled calendar branch, calendar push, calendar-list fetch (each obtains the token per call) | — | `[Implemented]` `src/pages/Settings.jsx:23-24,370-423`; `google-sync.md` AR-SYNC-01/02, §2a |
| 2 | Google Tasks connected | Integrations card | platform connector `69e7399b50555bb55752878a` | not connected | manual tasks import, scheduled tasks branch, due-date push, task-list fetch | — | `[Implemented]` `src/pages/Settings.jsx:25,370-423`; `google-sync.md` §2a |
| 3 | Calendar ticked under **Select Calendars to Sync** | per-calendar checkbox; rows created by **Fetch Calendars** | `SelectedCalendars.is_selected` (one row per Google calendar) | primary calendar ticked, others not (set on first fetch) | `syncGoogleCalendarToApp` (`filter({ is_selected: true })`); `autoSync` calendar branch (same filter); both untick a calendar that returns 404 | — | `[Implemented]` `src/pages/Settings.jsx:541-547,882-885`, `base44/functions/getGoogleCalendars/entry.ts:25-42`, `base44/functions/syncGoogleCalendarToApp/entry.ts:22,74-76`, `base44/functions/autoSync/entry.ts:26,48-50` |
| 4 | **📅 Google Calendar Events** ticked in the sync dialog | sync dialog checkbox | `ThemeSettings.sync_sources` contains `"calendar"` (JSON array) | ticked (`["calendar","tasks"]`) | Settings **Sync Selected** (runs the calendar import only when present); Calendar page sync button (same); `autoSync` (skips the calendar branch when absent) | — | `[Implemented]` `src/pages/Settings.jsx:250-256,1128-1131,1145`, `src/pages/CalendarPage.jsx:191-197`, `base44/functions/autoSync/entry.ts:15-23` |
| 5 | **✓ Google Tasks** ticked in the sync dialog | sync dialog checkbox | `ThemeSettings.sync_sources` contains `"tasks"` | ticked | Settings **Sync Selected**; Calendar page sync button; `autoSync` tasks branch | — | `[Implemented]` `src/pages/Settings.jsx:1134-1137,1146`, `src/pages/CalendarPage.jsx:198`, `base44/functions/autoSync/entry.ts:113` |
| 6 | Calendar ticked under **📅 Calendars to auto-sync** | Auto-Sync Schedule checkbox; rows loaded by **Load Calendars** / **Refresh** | `ThemeSettings.auto_sync_calendar_ids` (JSON array of `SelectedCalendars` row ids) | none ticked | no reader | `autoSync` (reads row 3 instead) | `[Partial]` `src/pages/Settings.jsx:513-526,917-919`, `base44/functions/autoSync/entry.ts:26`; `google-sync.md` §3 row "Calendars to auto-sync" (D-204) |
| 7 | List ticked under **✓ Task lists to auto-sync** | Auto-Sync Schedule checkbox; rows created by **Load Lists** / **Refresh** | `SelectedTaskLists.is_selected` (one row per Google task list) | ticked (set on first fetch) | no reader | `syncGoogleTasks` and `autoSync` (both walk every Google list) | `[Partial]` `src/pages/Settings.jsx:549-556,943-946`, `base44/functions/getGoogleTaskLists/entry.ts:28-42`, `base44/functions/syncGoogleTasks/entry.ts:39`, `base44/functions/autoSync/entry.ts:125`; `google-sync.md` §3 row "Which task lists" (D-204, D-483) |
| 8 | **Scheduled sync times** (`HH:MM` list) | Auto-Sync Schedule picker + **Add Time** / trash icon | `ThemeSettings.sync_times` (JSON array of `HH:MM`, sorted) | empty | no reader; the scheduled workflow fires once daily at `0 12 * * *` UTC | `Daily Auto-Sync` workflow, `autoSync` | `[Partial]` `src/pages/Settings.jsx:258-270,956-980`, `base44/workflows/Daily Auto-Sync.jsonc:10-12`, `base44/functions/autoSync/entry.ts:14-26`; `google-sync.md` §3 row "Sync times" (D-204); `preferences.md` A.2 (D-112) |
| 9 | Imported-task label and colour ("default task category label and color") | no control on Settings or elsewhere in `src/` | `ThemeSettings.task_sync_category`, `task_sync_color` | `"Google Tasks"` / empty (function fallbacks) | `syncGoogleTasks` applies both to every imported task | `autoSync` (constant label "Google Tasks", no colour) | `[Described]` `src/pages/UserManual.jsx:129,431`; `[Partial]` `base44/entities/ThemeSettings.jsonc:79-86`, `base44/functions/syncGoogleTasks/entry.ts:21-24,64-65`, `base44/functions/autoSync/entry.ts:135`; `google-sync.md` §3 row "Imported-task label" (D-203, D-222, D-481; Q-102) |

Summary of what the scheduled run actually reads from this page `[Implemented]` `base44/functions/autoSync/entry.ts:14-26,113,125`; `automations.md` AR-AUTO-14:

| Read by `autoSync` | Ignored by `autoSync` |
|---|---|
| `ThemeSettings.sync_sources` (row 4, 5) | `ThemeSettings.sync_times` (row 8) |
| `SelectedCalendars.is_selected` (row 3) | `ThemeSettings.auto_sync_calendar_ids` (row 6) |
| both connectors (rows 1, 2) | `SelectedTaskLists.is_selected` (row 7) |

## 3. When a sync runs

| Trigger | Sources | Calendar scope | Task scope | Window and mechanics | Tag / citation |
|---|---|---|---|---|---|
| Settings → **↻ Sync** → **Sync Selected** | `sync_sources`, calendar first then tasks | row 3 | every Google list | manual import, `google-sync.md` §4a / §5a | `[Implemented]` `src/pages/Settings.jsx:1144-1147` |
| Calendar page sync button | `sync_sources`, both in parallel; "No sync sources selected. Check Settings." when empty | row 3 | every Google list | same functions | `[Implemented]` `src/pages/CalendarPage.jsx:187-215` |
| Tasks page "Delete from Google too" | tasks import only | — | every Google list | `google-sync.md` §5a step 7 (D-210) | `[Implemented]` `src/pages/Tasks.jsx:347-350` |
| Scheduled workflow "Daily Auto-Sync", 12:00 UTC daily | `sync_sources` | row 3 | every Google list | scheduled import, `google-sync.md` §4b / §5b; acts on the calling identity (`automations.md` D-224) | `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10,33-34`, `base44/functions/autoSync/entry.ts:5-157` |
| App load | none | — | — | no sync runs on app load (`google-sync.md` AR-SYNC-14, D-217) | `[Implemented]` `src/components/Layout.jsx:40-49` |

- Settings copy: "Syncs run automatically at these times each day." `[Implemented]` `src/pages/Settings.jsx:959`
- Manual: "Set Auto-Sync times to have the app sync automatically at specific times each day." `[Described]` `src/pages/UserManual.jsx:422`
- Sign-up copy: "Sync Google Calendar events and Google Tasks automatically on app load." `[Described]` `src/pages/Auth.jsx:314` (D-217)

## 4. How the lists on this page are populated

- **On mount**, saved `SelectedCalendars` rows fill both the manual list and the auto-sync list; saved `SelectedTaskLists` rows fill the task-list list. Nothing is fetched from Google on mount. `[Implemented]` `src/pages/Settings.jsx:174-175,296-331`
- **Fetch Calendars** and **Load Calendars / Refresh** both invoke `getGoogleCalendars`; each replaces only its own list with the merged result (Google's list plus stored `is_selected` and `last_synced`). New calendars get a `SelectedCalendars` row (primary ticked); existing selections are kept. `[Implemented]` `src/pages/Settings.jsx:489-511`, `base44/functions/getGoogleCalendars/entry.ts:32-56`; `google-sync.md` AR-SYNC-15
- **Load Lists / Refresh** invokes `getGoogleTaskLists` (creating missing `SelectedTaskLists` rows, ticked) and then re-reads the saved rows so each checkbox has its entity id. `[Implemented]` `src/pages/Settings.jsx:528-539`, `base44/functions/getGoogleTaskLists/entry.ts:28-42`
- A successful manual calendar import re-fetches the manual list so "Last synced: …" refreshes; the auto-sync list is not refreshed by a sync. `[Implemented]` `src/pages/Settings.jsx:441`
- Both sync cards are hidden until any calendar or task-list row exists or either connector is connected. `[Implemented]` `src/pages/Settings.jsx:864` (Q-852)

## 5. What the user sees about sync history

- **Account** and **Last sync** under the Google Calendar connector, from the newest `SyncState` row; shown only while that connector is connected. The email is the app account's email after calendar imports (`google-sync.md` AR-SYNC-44, D-216). `[Implemented]` `src/pages/Settings.jsx:359-368,828-837`
- **Last synced: <MMM d, yy, hh:mm>** per calendar in the manual list, from `SelectedCalendars.last_synced`, stamped by both calendar imports. `[Implemented]` `src/pages/Settings.jsx:888-892`; `google-sync.md` AR-SYNC-46
- Task imports write no `SyncState` and no per-list stamp, so the page shows no task sync history. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:3-86`; `google-sync.md` AR-SYNC-47

## 6. Business rules (sync configuration)

- **BR-SET-30** A calendar is imported only when its manual checkbox is ticked; the auto-sync checkbox has no effect on any import. `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:22`, `base44/functions/autoSync/entry.ts:26`; `[Partial]` `src/pages/Settings.jsx:513-526` (D-204)
- **BR-SET-31** Every Google task list is imported whenever a tasks import runs; the task-list checkboxes have no effect on any import. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:39`, `base44/functions/autoSync/entry.ts:125`; `[Partial]` `src/pages/Settings.jsx:549-556` (D-204, D-483)
- **BR-SET-32** The sync-source choice made in the Settings dialog is the single account-wide choice: it governs Settings' own Sync Selected, the Calendar page button, and the scheduled run. `[Implemented]` `src/pages/Settings.jsx:250-256`, `src/pages/CalendarPage.jsx:191-198`, `base44/functions/autoSync/entry.ts:15-23,113`
- **BR-SET-33** The scheduled run happens once a day at 12:00 UTC for every account; the times listed under "Scheduled sync times" are stored and displayed only. `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10-12`; `[Partial]` `src/pages/Settings.jsx:956-980` (D-204)
- **BR-SET-34** Untick both sources and nothing syncs anywhere: Sync Selected is disabled, the Calendar page reports "No sync sources selected. Check Settings.", and the scheduled run returns "Nothing to sync". `[Implemented]` `src/pages/Settings.jsx:1147`, `src/pages/CalendarPage.jsx:199-201`, `base44/functions/autoSync/entry.ts:152` (per `google-sync.md` §A)
- **BR-SET-35** A calendar Google reports as gone (404) is unticked by the import itself and stays unticked until the user re-ticks it. `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:74-76`, `base44/functions/autoSync/entry.ts:48-50`; manual: "Invalid calendars are auto-deselected." `[Described]` `src/pages/UserManual.jsx:421`

## 7. Acceptance criteria

- **AC-SET-30** Given three calendars fetched with only the primary ticked, when Sync Selected runs with "calendar" ticked, then only the primary calendar's events are imported and only it gains a "Last synced" stamp. (refs BR-SET-30)
- **AC-SET-31** Given a calendar ticked only under "Calendars to auto-sync", when the 12:00 UTC run executes, then no events from that calendar are imported. (refs BR-SET-30; D-204)
- **AC-SET-32** Given two Google task lists with one unticked under "Task lists to auto-sync", when any tasks import runs, then tasks from both lists are imported. (refs BR-SET-31; D-483)
- **AC-SET-33** Given "tasks" unticked in the sync dialog, when the Calendar page sync button is clicked, then only the calendar import runs. (refs BR-SET-32)
- **AC-SET-34** Given scheduled times 07:00 and 19:00 saved, when a day passes, then exactly one scheduled run occurs, at 12:00 UTC. (refs BR-SET-33)
- **AC-SET-35** Given both sources unticked, then Sync Selected is disabled and the Calendar page button shows "No sync sources selected. Check Settings.". (refs BR-SET-34)

## 8. Discrepancies & open questions

- No new discrepancy is opened here; every stored-but-unread setting is already logged. Rows 6, 7, and 8 cite **D-204** (`google-sync.md`: `sync_times`, `auto_sync_calendar_ids`, and `SelectedTaskLists.is_selected` are written by `src/pages/Settings.jsx:258-270,513-526,549-556` and read by no function, while the workflow runs at a single cron `base44/workflows/Daily Auto-Sync.jsonc:10`), **D-112** (`preferences.md`, same fields), and **D-483** (`20-features/tasks/google-tasks.md`, task lists). Row 9 cites **D-203**, **D-222**, **D-481**. Row 1 and 2 ids cite **D-200**. Sign-up copy cites **D-217**.
- **Q-852** (opened in `spec.md`) Blocks §4. Are the two sync cards intended to be reachable while disconnected whenever saved rows exist?
- Cited: **Q-202** (`google-sync.md`) Are per-user `sync_times` and `auto_sync_calendar_ids` intended to drive scheduling and calendar scope for the scheduled import? Blocks §2 rows 6 and 8. **Q-102** (`preferences.md`) Where is the imported-task label meant to be set? Blocks §2 row 9.
