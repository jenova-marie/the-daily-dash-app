# Settings — Data Management (Level 2)

**Feature code:** `SET` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 23 · Described 3 · Partial 2

**Sources owned (this feature's bindings only):** `src/pages/Settings.jsx:129-131,573-606,1054-1081,1176-1207` (the Manage App Data card, its dialog, and the post-deletion steps)
**Sources referenced (owned elsewhere):** `base44/functions/deleteSyncedData/entry.ts` → `10-architecture/admin-operations.md` §2.7 (entity lists, pacing, return values); `base44/functions/deleteUserAccount/entry.ts` → `admin-operations.md` §2.8, `auth-and-account.md` §10; connectors → `10-architecture/google-sync.md` §2c; `src/components/DeletedItemReview.jsx` → `20-features/calendar/deleted-item-review.md`; `src/pages/UserManual.jsx:435-437` → `20-features/user-manual`.

## 1. Purpose

The **Manage App Data** card gives the account owner two ways to start over without leaving the account: remove what came from Google, or remove everything the app holds. Both promise that Google itself is untouched, and both end by disconnecting the connectors so nothing comes back on the next sync. Account deletion (which also removes the login) is on the Account card and is owned by `auth-and-account.md` §10.

Manual, "Data Management": "Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch. You can also review and manage **deleted sync items** to prevent unwanted re-imports." `[Described]` `src/pages/UserManual.jsx:435-437`

## 2. The two actions side by side

| | **Delete Synced Data** | **Delete All App Data** |
|---|---|---|
| Card copy (verbatim) | "Remove all synced Google Calendar events and tasks. Your Google data remains unchanged." | "Remove everything: synced data, tasks, chores, goals, checklists, education plans, quotes, and links. Cannot be undone." |
| Button label | **Delete Synced Data** | **Delete All App Data** |
| Dialog title | **Delete Synced Data?** | **Delete All App Data?** |
| Dialog description (verbatim) | "This will permanently remove all synced Google Calendar events and tasks from your app. You can re-sync your data anytime." | "This will permanently remove ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone." |
| Confirm button | **Delete Synced Data** | **Delete Everything** |
| Cancel button | **Cancel** (resets the flag) | **Cancel** (resets the flag) |
| Function call | `deleteSyncedData` with `{ deleteAllAppData: false }` | `deleteSyncedData` with `{ deleteAllAppData: true }` |
| Entities emptied | `ScheduleItem` (every row, any source type), `SelectedCalendars`, `SyncState`; then `Task` rows where `google_task_id` exists | 25 entities in a set order: `ScheduleItem, SelectedCalendars, SyncState, Task, DeletedSyncItem, SelectedTaskLists, Chore, ChoreUser, Goal, GoalTask, DailyChecklist, ChecklistCompletion, EducationPlan, EducationActivity, Learner, DailyQuote, Link, DailyPillarTracking, PillarActivity, Affirmation, HealthPillar, ReminderSettings, DailyGratitude, ThemeSettings, CollageImage` |
| Survives | every `Task` without `google_task_id`; `SelectedTaskLists`; `DeletedSyncItem`; all chores, goals, checklists, education, quotes, links, vision-board data, `ThemeSettings`, `TrashBin`, `ChoreLibrary`, `FavoriteActivity`, `UserCollageImage`, the `User` | `User`, `TrashBin`, `ChoreLibrary`, `FavoriteActivity`, `UserCollageImage`; every device-local preference |
| Success notice (verbatim) | "✓ Synced data deleted & integrations disconnected" | "✓ All app data deleted & integrations disconnected" |
| Google side | untouched | untouched |
| Connectors afterwards | every connector currently connected is disconnected | same |
| Tag / citation | `[Implemented]` `src/pages/Settings.jsx:1056-1067,1061,1180,1187,1202,588`, `base44/functions/deleteSyncedData/entry.ts:22-36,68-83` | `[Implemented]` `src/pages/Settings.jsx:1068-1079,1073,1180,1186,1202,588`, `base44/functions/deleteSyncedData/entry.ts:49-66` |

Entity lists, pacing (pages of 50, 50 ms per delete, 200 ms per page, 300 ms per entity, at most 200 pages per entity, per-delete failures ignored), and return payloads are owned by `admin-operations.md` AR-ADMIN-26..29.

## 3. The shared dialog and its lifecycle

- One alert dialog serves both buttons; the button clicked sets a flag that selects the copy, the confirm label, and the function argument. `[Implemented]` `src/pages/Settings.jsx:131,1061,1073,1176-1207`
- **Before confirmation:** title in destructive colour, description per §2, buttons **Cancel** / **Delete Synced Data** or **Delete Everything** (destructive). Escape and outside click close it. `[Implemented]` `src/pages/Settings.jsx:1176-1189,1195-1204`
- **While running:** title **Deleting...**, description "Please wait while your data is being deleted. Do not close this window.", a large destructive-coloured spinner, and "This may take a few minutes...". Escape, outside click, and external open-state changes are ignored. At the same moment the floating notice reads "Deleting data... this may take a few minutes". `[Implemented]` `src/pages/Settings.jsx:575-577,1176-1177,1180,1184,1190-1194`
- **After the function returns:** for each connector shown as connected, the page disconnects it (a failed disconnect is ignored), with the code comment "Disconnect all integrations so data doesn't re-sync automatically". `[Implemented]` `src/pages/Settings.jsx:579-586`; `google-sync.md` AR-SYNC-09
- **Success:** the floating notice shows the success line (§2); after 2 s the notice clears, the dialog closes, and the flag resets; connector status is re-probed and the newest `SyncState` reloaded (now none, so "Account" / "Last sync" disappear). `[Implemented]` `src/pages/Settings.jsx:588-596`
- **Failure:** the floating notice shows "✗ Failed to delete data: <message>" and remains; after 3 s the dialog closes and the flag resets; connectors are not disconnected and status is not re-probed. `[Implemented]` `src/pages/Settings.jsx:597-605`
- **What the page does not do afterwards:** it does not reload `ThemeSettings`, the calendar lists, the task lists, or the trash list; in-memory copies of those remain until the page is reopened. `[Implemented]` `src/pages/Settings.jsx:573-606` (only `checkConnectorStatus` and `loadSyncState` are called)

## 4. What each promise means in practice

- **"Your Google data remains unchanged."** Neither path sends any request to Google; the function only deletes local rows, and disconnecting a connector revokes the app's token without touching Google content. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:38-88` (no fetch), `src/pages/Settings.jsx:583`; `google-sync.md` AR-SYNC-08
- **"You can re-sync your data anytime."** After Delete Synced Data the connectors are disconnected, `SelectedCalendars` is empty, and `SyncState` is gone; re-syncing means Connect again, Fetch Calendars (which recreates rows with only the primary ticked), re-tick calendars, and Sync. `[Implemented]` `src/pages/Settings.jsx:579-586`, `base44/functions/deleteSyncedData/entry.ts:69-73`, `base44/functions/getGoogleCalendars/entry.ts:25-42`
- **"Useful for re-syncing from scratch."** (manual) The sync-source choice, auto-sync calendars, and scheduled times in `ThemeSettings` survive Delete Synced Data, so the next sync uses the same source choice; they are removed by Delete All App Data. `[Described]` `src/pages/UserManual.jsx:436`; `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:58,68-75`
- **"Remove everything"** in the all-data path leaves the trash, chore library, activity library, private collage uploads, and the login in place, and clears the account's theme, feature toggles, and greeting name along with the data. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60`; `admin-operations.md` AR-ADMIN-28
- **Delete Synced Data and hand-made schedule items.** The default path empties `ScheduleItem` without a source-type filter, so custom blocks and in-app events go with the imported calendar rows, while hand-made tasks stay. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:69,75` (D-853)
- **Google-side push rows.** A custom block that had been pushed to Google keeps its Google event; the local row's deletion goes through the platform's delete workflow only when the workflow fires for user-scoped deletes, which is owned by `automations.md` §3 and `google-sync.md` §6a. Not observed here. `[Partial]` `base44/workflows/Sync App Events to Google Calendar (Delete).jsonc:5-12` (whether function-initiated deletes trigger it is not evidenced in the repository; Q-855)

## 5. "Deleted sync items" (manual) — where that lives

- The manual's "review and manage deleted sync items to prevent unwanted re-imports" refers to the tombstone review panel "Items Deleted from Google Calendar" on the Calendar page, not to anything on Settings. `[Described]` `src/pages/UserManual.jsx:436`; `[Implemented]` `src/components/DeletedItemReview.jsx:16-21`, `src/pages/CalendarPage.jsx:219` (owned by `20-features/calendar/deleted-item-review.md`)
- No function creates a tombstone, so the panel is populated by nothing in the current code. `[Partial]` `google-sync.md` AR-SYNC-41 (D-211)
- Delete All App Data empties `DeletedSyncItem`; Delete Synced Data does not. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:52,68-75`; `google-sync.md` AR-SYNC-43

## 6. Relation to account deletion

| | Delete All App Data | Delete Account |
|---|---|---|
| Card | Manage App Data | Account |
| Dialog copy | "…ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone." | "…your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone." |
| Entities | 25 (`deleteSyncedData`) | 16 (`deleteUserAccount`) |
| Login | kept; user stays signed in on Settings | removed; signed out to `/auth` |
| Connectors | the two Google connectors, if connected, by the page afterwards | six connectors by the function before deleting data |
| Citation | `src/pages/Settings.jsx:573-596`, `base44/functions/deleteSyncedData/entry.ts:49-66` | `src/pages/Settings.jsx:558-571`, `base44/functions/deleteUserAccount/entry.ts:12-81` |

Both `[Implemented]`. The differing entity lists are logged as **D-214** (`admin-operations.md`) and **D-333** (`auth-and-account.md`); the question of intended scope is **Q-211** / **Q-333**.

## 7. Business rules

- **BR-SET-50** Both wipes require a confirmation dialog whose copy names the scope; the confirm label differs ("Delete Synced Data" / "Delete Everything"). `[Implemented]` `src/pages/Settings.jsx:1176-1204`
- **BR-SET-51** A running wipe cannot be dismissed. `[Implemented]` `src/pages/Settings.jsx:1176-1177`
- **BR-SET-52** Every wipe ends by disconnecting each connected connector, then re-probing. `[Implemented]` `src/pages/Settings.jsx:579-586,595`
- **BR-SET-53** Delete Synced Data keeps hand-made tasks and removes every schedule item. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:69,75` (D-853)
- **BR-SET-54** Neither wipe touches the trash, the chore library, the activity library, private collage uploads, the login, or any device-local preference. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60,68-75`; `preferences.md` Part D (no localStorage write in `src/pages/Settings.jsx:573-606`)
- **BR-SET-55** No request reaches Google during a wipe. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:38-88`

## 8. Acceptance criteria

- **AC-SET-50** Given a hand-made task, an imported task, an imported calendar event, and a custom block, when Delete Synced Data completes, then the hand-made task remains and the other three are gone. (refs BR-SET-53)
- **AC-SET-51** Given both connectors connected, when either wipe completes, then both Integrations cards show Connect and the success notice ends with "& integrations disconnected". (refs BR-SET-52)
- **AC-SET-52** Given the all-data dialog, when Delete Everything completes, then chores, goals, checklists, education plans, quotes, links, vision-board ratings, and the theme row are gone, the user is still signed in, and the Trash Bin still lists tasks deleted within 24 hours. (refs BR-SET-54)
- **AC-SET-53** Given a wipe in progress, when Escape is pressed, then the dialog stays open reading "Deleting..." / "Please wait while your data is being deleted. Do not close this window.". (refs BR-SET-51)
- **AC-SET-54** Given the function fails, then the notice reads "✗ Failed to delete data: <message>", the dialog closes after about 3 s, and the connectors remain connected. (refs §3)
- **AC-SET-55** Given Delete Synced Data has completed, when the user reconnects Google Calendar and clicks Fetch Calendars, then calendars reappear with only the primary ticked, and Sync Selected uses the previously saved sync sources. (refs §4)

## 9. Discrepancies & open questions

- **D-853** (opened in `spec.md` §14) "Delete Synced Data" copy names "synced Google Calendar events and tasks" (`src/pages/Settings.jsx:1058,1187`); the function empties every `ScheduleItem` regardless of `source_type` (`base44/functions/deleteSyncedData/entry.ts:69`) and only tasks with `google_task_id` (`:22-25,75`).
- **D-855** The all-data card copy lists "synced data, tasks, chores, goals, checklists, education plans, quotes, and links" (`src/pages/Settings.jsx:1070`) and the dialog repeats that list (`:1186`); the function additionally empties `DailyPillarTracking`, `PillarActivity`, `Affirmation`, `HealthPillar`, `ReminderSettings`, `DailyGratitude`, `ThemeSettings`, `CollageImage`, `DeletedSyncItem`, `SelectedTaskLists`, `ChoreUser`, `Learner` (`base44/functions/deleteSyncedData/entry.ts:50-60`) and leaves `TrashBin`, `ChoreLibrary`, `FavoriteActivity`, `UserCollageImage` in place (absence from that list; `admin-operations.md` AR-ADMIN-28).
- Cited: **D-211** (no tombstone writer), **D-214** / **D-333** (account deletion versus all-data lists).
- **Q-851** (opened in `spec.md`) Blocks §2, §4. Is "Delete Synced Data" intended to remove in-app events and custom blocks?
- **Q-855** Blocks §4. When `deleteSyncedData` deletes a `custom` schedule item that carries a `google_event_id`, is the entity-triggered delete workflow intended to fire and remove the Google event, contrary to "Your Google data remains unchanged."? No evidence in the repository shows whether function-initiated deletes trigger the workflow (`base44/workflows/Sync App Events to Google Calendar (Delete).jsonc:5-12`).
- Cited: **Q-211** / **Q-333** (intended scope of account deletion versus all-data wipe).
