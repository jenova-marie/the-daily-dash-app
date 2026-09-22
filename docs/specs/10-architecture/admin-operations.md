# Admin & Maintenance Operations — Architecture Spec

**Architecture area:** `ADMIN` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 38 · Described 3 · Partial 2

**Sources owned:** `base44/functions/generateDailyQuotes/entry.ts`, `base44/functions/makeImagesDefaults/entry.ts`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts`, `base44/functions/clearChoreLibraryAssignments/entry.ts`, `base44/functions/initializeDefaultCollageImages/entry.ts`, `base44/functions/deduplicateCalendarEvents/entry.ts`, `base44/functions/deleteSyncedData/entry.ts`, `base44/functions/deleteUserAccount/entry.ts`; catalogue entries (§A) for `base44/functions/fetchDailyQuote/entry.ts`, `base44/functions/generateChores/entry.ts`, `base44/functions/generateActivities/entry.ts`
**Sources referenced (owned elsewhere):** `src/pages/Settings.jsx` (Manage App Data, Delete Account) → `20-features/settings`; `src/components/Layout.jsx`, `src/pages/AcceptTerms.jsx` → `20-features/app-shell`; `base44/entities/User.jsonc`, `CollageImage.jsonc`, `ChoreLibrary.jsonc` → `10-architecture/data-model/`; `base44/workflows/*.jsonc` → `automations.md`

**Permissions:** see the "Who may call" column in §1; `admin` means `User.role == "admin"` (`base44/entities/User.jsonc:3-9`)

## 1. Overview

| Function | Who may call | UI entry point | Why it exists (user-facing reason) |
|---|---|---|---|
| `generateDailyQuotes` | admin only (403 otherwise) | none; scheduled workflow | Everyone wakes up with today's quote already there |
| `makeImagesDefaults` | admin only | none | The admin marks their own collage as the seed set new users receive |
| `backfillDefaultImagesToAllUsers` | admin only | none | Newly added seed images reach users who already have a board |
| `clearChoreLibraryAssignments` | admin only | none | Library entries are templates, never assigned to a person |
| `initializeDefaultCollageImages` | any authenticated user | app-shell mount, terms acceptance, scheduled workflow | A new user's vision board is not empty |
| `deduplicateCalendarEvents` | any authenticated user | none | "My calendar has doubled events" repair |
| `deleteSyncedData` | any authenticated user | Settings → Manage App Data | Wipe synced Google data (or everything) and start over |
| `deleteUserAccount` | any authenticated user (self) | Settings → Account → Delete Account | Delete my account and my data |

- **AR-ADMIN-01** Four functions have no call site anywhere in `src/`; they are reachable only by direct invocation of the function endpoint. `[Partial]` absence of `functions.invoke('makeImagesDefaults'|'backfillDefaultImagesToAllUsers'|'clearChoreLibraryAssignments'|'deduplicateCalendarEvents'` in `src/`
- **AR-ADMIN-02** The admin gate is a role check on the authenticated caller: `user.role !== 'admin'` → 403 (`"Forbidden"`, or `"Admin access required"` in the backfill). The glossary defines admin as "may run seed/backfill/cleanup functions. Not a product persona." `[Implemented]` `base44/functions/makeImagesDefaults/entry.ts:12-14`, `base44/functions/clearChoreLibraryAssignments/entry.ts:12-14`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:8-10`, `base44/functions/generateDailyQuotes/entry.ts:16-18`
- **AR-ADMIN-03** Settings displays the caller's role verbatim under "Account" → "Role". `[Implemented]` `src/pages/Settings.jsx:621-624`

## 2. Function specifications

### 2.1 `generateDailyQuotes`

- **AR-ADMIN-04** Inputs: none. Outputs: `{ success, date, generated, skipped }`; 401; 403; 500 with the exception message. `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:12-18,92-94`
- **AR-ADMIN-05** Date = server `toLocaleDateString('en-CA')` (UTC `YYYY-MM-DD`). `[Implemented]` `:20`
- **AR-ADMIN-06** Reads all `User` rows with the service role. Per user: if a `DailyQuote` exists for `(date: today, created_by: user.email)` → skipped. Otherwise loads that user's last 200 quotes (`-created_date`) to build a used-set (trimmed, lower-cased text). `[Implemented]` `:23-38`
- **AR-ADMIN-07** Quote source: up to 8 attempts against `https://api.quotable.io/quotes/random?maxLength=220&limit=5`, 1 s pause before every attempt after the first, taking the first candidate not in the used-set; a network throw ends the attempts. `[Implemented]` `:40-61`
- **AR-ADMIN-08** Fallback: the LLM is asked for one quote with the prompt "Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: <up to 20 most recent, first 60 chars each, or 'none'>. Pick from a wide variety of authors throughout history. Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}" with a JSON schema `{ quote, author }`. `[Implemented]` `:63-78`
- **AR-ADMIN-09** Writes `DailyQuote { quote, author, date, is_favorite: false, created_by: user.email }` via the service role. `[Implemented]` `:80-89`
- Entities: R `User`, R/W `DailyQuote`. External: quotable.io, LLM. Trigger: `automations.md` §2a.

### 2.2 `makeImagesDefaults`

- **AR-ADMIN-10** Inputs: none. Reads the caller's own `CollageImage` rows (1000, `-order`); none → 400 `{ error: "No images found", message: "Upload images to your collage first" }`. `[Implemented]` `base44/functions/makeImagesDefaults/entry.ts:16-21`
- **AR-ADMIN-11** Sets `is_default: true` on each of those rows one by one with the service role; returns `{ success, message: "Marked N images as defaults for new users", count }`. `[Implemented]` `:23-39`
- **AR-ADMIN-12** `CollageImage.is_default` is the flag `initializeDefaultCollageImages` and `backfillDefaultImagesToAllUsers` read as the seed set. `[Implemented]` `base44/entities/CollageImage.jsonc` (`is_default`), `base44/functions/initializeDefaultCollageImages/entry.ts:20`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13-14`
- Entities: R/W `CollageImage`. External: none. Ordering: run before `backfillDefaultImagesToAllUsers` so there is a seed set to propagate.

### 2.3 `backfillDefaultImagesToAllUsers`

- **AR-ADMIN-13** Inputs: none. Reads every `CollageImage` (10000, `-order`, service role) and keeps `is_default === true`; none → 400 `No default images found. Total images: N`. `[Implemented]` `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:12-18`
- **AR-ADMIN-14** Reads every `User` (10000, `-created_date`). Per user: loads that user's images (1000), builds a set of existing `image_url`, and bulk-creates the default images whose URL the user lacks, as `{ image_url, title, order (default 0), is_default: false, created_by: targetUser.email }`. Per-user failures are logged and the loop continues. `[Implemented]` `:20-53`
- **AR-ADMIN-15** Returns `{ success, message: "Backfilled default images to all users", usersProcessed, imagesCreated }`. `[Implemented]` `:55-60`
- Entities: R `User`, R/W `CollageImage`. External: none. Dedup key: `image_url` per user. No pacing.

### 2.4 `clearChoreLibraryAssignments`

- **AR-ADMIN-16** Inputs: none. Reads up to 500 `ChoreLibrary` rows (`-created_date`, service role) and, for each with a truthy `assigned_to`, updates `assigned_to: null`. Returns `{ message: "Cleared assignments from N library items", totalItems, clearedCount }`. The entity schema declares no `assigned_to` property. `[Implemented]` `base44/functions/clearChoreLibraryAssignments/entry.ts:16-32`, `base44/entities/ChoreLibrary.jsonc` (D-225)
- **AR-ADMIN-17** The glossary's definition of the chore library ("Reusable, unassigned chore templates") is the rule this function enforces after the fact. `[Implemented]` `docs/specs/00-overview/glossary.md` (chore library row), `base44/functions/clearChoreLibraryAssignments/entry.ts:19-26`
- Entities: R/W `ChoreLibrary`. External: none. This function pins SDK `0.8.31` where every other function pins `0.8.25`. `[Implemented]` `base44/functions/clearChoreLibraryAssignments/entry.ts:1`, e.g. `base44/functions/autoSync/entry.ts:1`

### 2.5 `initializeDefaultCollageImages`

- **AR-ADMIN-18** Inputs: none. If the caller already has any `CollageImage` → `{ success, created: false, count }` and no writes. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-17`
- **AR-ADMIN-19** Otherwise reads `is_default: true` images across all users (100, `-order`, service role); none → `{ success, created: false, message: "No default images to initialize" }`. `[Implemented]` `:19-24`
- **AR-ADMIN-20** Copies `{ image_url, title, order, is_default: false }` into the caller's account via `bulkCreate` in batches of 10 with a 100 ms pause between batches; returns `{ success, created: true, count }`. `[Implemented]` `:26-45`
- **AR-ADMIN-21** Triggers: app-shell mount (every mount, failures ignored), terms acceptance "Continue" (failure logged), and the daily workflow. `[Implemented]` `src/components/Layout.jsx:47-48`, `src/pages/AcceptTerms.jsx:52-57`, `base44/workflows/Initialize Collage Images for All Users.jsonc:33`
- Entities: R/W `CollageImage`. External: none.

### 2.6 `deduplicateCalendarEvents`

- **AR-ADMIN-22** Inputs: none. Any authenticated user; acts on the caller's rows. Exports `deduplicate(base44)` for reuse by other modules. `[Implemented]` `base44/functions/deduplicateCalendarEvents/entry.ts:3,40-46`
- **AR-ADMIN-23** Loads `source_type: calendar` rows by repeating a 500-row `-created_date` query up to 20 times, stopping when a batch returns fewer than 500. `[Implemented]` `:4-14`
- **AR-ADMIN-24** Group key: `gid:<google_event_id>` when present, else `manual:<title>|<date>|<start_time>`. In each group with more than one row, the newest by `updated_date` (fallback `created_date`) is kept and the rest are deleted. `[Implemented]` `:16-30`
- **AR-ADMIN-25** Deletes run in parallel batches of 20; individual delete failures are ignored. Returns `{ success, message: "Deleted N duplicate calendar events out of N total.", deleted, total }`. `[Implemented]` `:32-37,46-52`
- Entities: R/W `ScheduleItem`. External: none. Relation to import dedup: `google-sync.md` §4a step 8; `schedule-hub.md` §10.

### 2.7 `deleteSyncedData`

- **AR-ADMIN-26** Inputs: `{ deleteAllAppData?: boolean }` (strict `=== true`). Any authenticated user; acts on the caller's rows through the user-scoped client. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:40-47`
- **AR-ADMIN-27** Default path ("Delete Synced Data"), sequentially: all `ScheduleItem`, all `SelectedCalendars`, all `SyncState`, then only `Task` rows where `google_task_id` exists. Hand-made tasks survive. Returns `{ message: "All synced data has been deleted", deletedScheduleItems, deletedSelectedCalendars, deletedSyncStates, deletedTasks }`. `[Implemented]` `:68-83`
- **AR-ADMIN-28** `deleteAllAppData` path walks a fixed list of 25 entities in order: `ScheduleItem, SelectedCalendars, SyncState, Task, DeletedSyncItem, SelectedTaskLists, Chore, ChoreUser, Goal, GoalTask, DailyChecklist, ChecklistCompletion, EducationPlan, EducationActivity, Learner, DailyQuote, Link, DailyPillarTracking, PillarActivity, Affirmation, HealthPillar, ReminderSettings, DailyGratitude, ThemeSettings, CollageImage`. Returns `{ message: "All app data deleted" }`. Not on the list: `User`, `TrashBin`, `ChoreLibrary`, `FavoriteActivity`, `UserCollageImage`. `[Implemented]` `:49-66`
- **AR-ADMIN-29** Pacing: pages of 50 (`-created_date`), 50 ms after each delete, 200 ms after each full page, 300 ms between entities, at most 200 pages per entity; individual delete failures are ignored. `[Implemented]` `:5-36,63,70-74`
- **AR-ADMIN-30** Settings UI: card "Manage App Data" with "Delete Synced Data" ("Remove all synced Google Calendar events and tasks. Your Google data remains unchanged.") and "Delete All App Data" ("Remove everything: synced data, tasks, chores, goals, checklists, education plans, quotes, and links. Cannot be undone."). Confirm dialog: "Delete Synced Data?" / "This will permanently remove all synced Google Calendar events and tasks from your app. You can re-sync your data anytime." or "Delete All App Data?" / "This will permanently remove ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone."; buttons "Cancel" and "Delete Synced Data" / "Delete Everything"; while running: "Deleting..." / "Please wait while your data is being deleted. Do not close this window." / "This may take a few minutes..."; the dialog cannot be dismissed while running. `[Implemented]` `src/pages/Settings.jsx:1054-1081,1176-1207`
- **AR-ADMIN-31** After the function returns, Settings disconnects every connected connector, shows "✓ Synced data deleted & integrations disconnected" or "✓ All app data deleted & integrations disconnected", and re-probes connector status and sync state. `[Implemented]` `src/pages/Settings.jsx:573-596`
- **AR-ADMIN-32** User Manual: "Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch." `[Described]` `src/pages/UserManual.jsx:436`
- Entities: W as listed. External: none.

### 2.8 `deleteUserAccount`

- **AR-ADMIN-33** Inputs: none. Any authenticated user, acting on themselves. Outputs `{ success, message: "Account and all data deleted successfully" }`; 500 with the exception message. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:5-10,83-86`
- **AR-ADMIN-34** **Ordering:** (1) revoke OAuth by disconnecting six connectors, ignoring "not connected" failures; (2) delete data entity by entity; (3) delete the auth user with the service role. `[Implemented]` `:12-28,30-78,80-81`
- **AR-ADMIN-35** Entities deleted (16, in order, each filtered by `created_by = user.email`, deletes run in parallel per entity, no pacing): `Task, ScheduleItem, DailyChecklist, ChecklistCompletion, Goal, GoalTask, Chore, ChoreUser, EducationPlan, EducationActivity, Learner, DailyQuote, Link, ThemeSettings, SelectedCalendars, SyncState`. Not deleted: `DeletedSyncItem, SelectedTaskLists, DailyPillarTracking, PillarActivity, Affirmation, HealthPillar, ReminderSettings, DailyGratitude, CollageImage, UserCollageImage, TrashBin, ChoreLibrary, FavoriteActivity`. `[Implemented]` `:31-78` (D-214)
- **AR-ADMIN-36** Settings UI: "Delete Account" button with copy "Permanently delete your account and all associated data. This action cannot be undone."; confirm dialog "Delete Account?" / "This will permanently delete your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone."; buttons "Cancel" / "Delete Account" ("Deleting..." while running). On success the client logs out and replaces the location with `/auth`; on failure an alert "Failed to delete account: <message>" is shown. `[Implemented]` `src/pages/Settings.jsx:558-571,632-642,1089-1109`
- Entities: W as listed; `User` via auth. External: connector revocation ×6.

## 3. Connector ids and revocation

| Connector | Id | Referenced by | Revoked when |
|---|---|---|---|
| Google Calendar ("GCal2") | `69e73980123bb49cf43baf96` | sync functions, Settings, to-do delete, account deletion | Settings "Disconnect", "Delete Synced/All Data" post-step (if connected), account deletion |
| Google Tasks ("GTasks2") | `69e7399b50555bb55752878a` | sync functions, Settings, to-do delete, account deletion | same as above |
| Dropbox | `69d737c5f7b27024315facdc` | account deletion only | account deletion only |
| Google Docs | `69d737a26b81df6409501d64` | account deletion only | account deletion only |
| Gmail | `69d73791470f6b941284c243` | account deletion only | account deletion only |
| Google Drive | `69d7377e8cef111d099e117b` | account deletion only | account deletion only |

- **AR-ADMIN-37** The six ids and their comments (`GCal2`, `GTasks2`, `Dropbox`, `Google Docs`, `Gmail`, `Google Drive`) are listed in the account-deletion function; the last four appear nowhere else in `base44/` or `src/`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:13-20`; absence elsewhere (grep of the four ids)
- **AR-ADMIN-38** The landing page names Google Drive as a sync target: "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity." `[Described]` `src/pages/LandingPage.jsx:12`; no Drive read or write exists. `[Partial]` absence in `base44/functions/` and `src/`
- **AR-ADMIN-39** The sign-up and terms-acceptance pages reference two further id pairs for Calendar and Tasks; see `google-sync.md` §2a and D-200. `[Implemented]` `src/pages/Auth.jsx:17-18`, `src/pages/AcceptTerms.jsx:34-35`
- **AR-ADMIN-40** Privacy Policy: "When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necess…" and a section "4. Google API Data" citing the Google API Services User Data Policy. `[Described]` `src/pages/PrivacyPolicy.jsx:22,31-32`

## 4. Rate-limit pacing summary

| Function | Page / batch size | Pauses | Failure handling |
|---|---|---|---|
| `deleteSyncedData` | 50 per page, ≤200 pages per entity | 50 ms per delete, 200 ms per page, 300 ms per entity | per-delete ignored |
| `initializeDefaultCollageImages` | bulkCreate ×10 | 100 ms between batches | outer 500 |
| `backfillDefaultImagesToAllUsers` | one bulkCreate per user | none | per-user logged, loop continues |
| `deduplicateCalendarEvents` | 500 per read, ≤20 reads; delete ×20 in parallel | none | per-delete ignored |
| `generateDailyQuotes` | per user; ≤8 quote attempts | 1 s before attempts 2–8 | quotable throw ends attempts → LLM |
| `makeImagesDefaults`, `clearChoreLibraryAssignments` | one update per row | none | outer 500 |
| `deleteUserAccount` | all rows per entity in parallel | none | connector revoke failures ignored; outer 500 |

`[Implemented]` citations as in §2.

## 5. Discrepancies & open questions

- **D-214** Account deletion removes 16 entity types (`base44/functions/deleteUserAccount/entry.ts:31-78`); "Delete All App Data" removes 25 (`base44/functions/deleteSyncedData/entry.ts:50-60`); the account-deletion dialog says "all your data" (`src/pages/Settings.jsx:1094`). Entities such as `DailyPillarTracking`, `CollageImage`, `UserCollageImage`, `DailyGratitude` and `ReminderSettings` are outside the account-deletion list.
- **D-223**, **D-224** (logged in `automations.md`) Scheduled invocations of `initializeDefaultCollageImages` and `autoSync` act on the calling identity only.
- **D-225** `clearChoreLibraryAssignments` reads and nulls `ChoreLibrary.assigned_to` (`base44/functions/clearChoreLibraryAssignments/entry.ts:22-23`); the `ChoreLibrary` schema declares no such property (`base44/entities/ChoreLibrary.jsonc`).
- **Q-209** Blocks §2.4. Is `ChoreLibrary.assigned_to` a field from an earlier schema that rows may still carry, which this function exists to clear?
- **Q-210** Blocks §1. Are the four functions without an app entry point (§AR-ADMIN-01) meant to be run from the platform console only, or is an admin UI planned?
- **Q-211** Blocks §2.8. Is the shorter entity list in account deletion intended (for example to keep shared seed images), or is the 25-entity list the intended scope? (Both lists are implemented as cited.)

## A. Function catalogue — admin, maintenance, and remaining user-facing functions

The eleven functions below are specified here; the ten sync functions are in `google-sync.md` §A. Together they cover all 21 entries in `base44/functions/`.

| Function | Caller(s) | Inputs | Outputs | Entities read / written | External calls | Embedded rules |
|---|---|---|---|---|---|---|
| `generateDailyQuotes` | workflow | none | `{ success, date, generated, skipped }` | R `User`; R/W `DailyQuote` (service role) | quotable.io; LLM fallback | §2.1; admin only |
| `makeImagesDefaults` | none in UI | none | `{ success, message, count }`; 400 when no images | R/W `CollageImage` | none | §2.2; admin only |
| `backfillDefaultImagesToAllUsers` | none in UI | none | `{ success, message, usersProcessed, imagesCreated }`; 400 when no defaults | R `User`, R/W `CollageImage` | none | §2.3; admin only; dedup by `image_url` |
| `clearChoreLibraryAssignments` | none in UI | none | `{ message, totalItems, clearedCount }` | R/W `ChoreLibrary` (500) | none | §2.4; admin only |
| `initializeDefaultCollageImages` | app shell, terms page, workflow | none | `{ success, created, count \| message }` | R/W `CollageImage` | none | §2.5; no-op when the caller has any image |
| `deduplicateCalendarEvents` | none in UI | none | `{ success, message, deleted, total }` | R/W `ScheduleItem` (calendar) | none | §2.6; keep newest per key |
| `deleteSyncedData` | Settings | `{ deleteAllAppData? }` | `{ message, …counts }` | W 4 entities (default) or 25 (all) | none | §2.7; hand-made tasks survive the default path |
| `deleteUserAccount` | Settings | none | `{ success, message }` | W 16 entities; auth user | connector revoke ×6 | §2.8; revoke → delete data → delete user |
| `fetchDailyQuote` | dashboard quote widget, Quotes page | `{ date?, force? }` | the `DailyQuote` row (existing or new); 500 "Could not generate a quote" | R `DailyQuote` (200 newest, user scope); W create / delete `DailyQuote` | quotable.io (≤8 attempts, no pause); LLM fallback | `date` defaults to server UTC date; without `force` returns today's newest row and silently deletes other rows for that date; with `force` deletes all of today's rows first; used-set built before any deletion; LLM prompt as §2.1 plus "authors, philosophers, scientists, writers, athletes, and leaders throughout history — choose someone different each time" `base44/functions/fetchDailyQuote/entry.ts:9-84` |
| `generateChores` | chore generator | `{ room, choreType, ageGroup, quantity, mealType }` | `{ chores: [{ title, description, frequency, time_estimate, priority }] }`; 400 "Missing required fields" / "Room is required for non-meal chores" | none (caller persists to `Chore` / `ChoreLibrary`) | LLM with JSON schema | `choreType` and `ageGroup` required; `room` required unless `choreType == "Meal"`; age-group phrases `3-5`→"toddlers and preschoolers (3-5 years old)", `5-7`→"young children (5-7 years old)", `8-10`→"children (8-10 years old)", `11-13`→"pre-teens (11-13 years old)", `14-17`→"teenagers (14-17 years old)", `18+`→"young adults (18+ years old)", `Adult`→"adults", else "people"; meal prompt asks for `quantity ?? 5` "<mealType> meal ideas" with frequency/time/priority guidance and "Make sure meals are age-appropriate…"; chore prompt asks for chores "in the <room> room, specifically focused on <choreType> tasks" and "Younger kids (5-7) should have simple, safe tasks. Older teens and adults can handle more complex responsibilities." `base44/functions/generateChores/entry.ts:12-82`; caller `src/components/ChoreGenerator.jsx:56-62` |
| `generateActivities` | activity generator | `{ ageGroup, subject, activityType, quantity }` | `{ activities: [{ title, description, duration, materials }] }`; 400 "Missing required fields" | none (caller persists to `EducationActivity` / `FavoriteActivity`) | LLM with JSON schema | `ageGroup`, `subject`, `activityType` required; prompt "Generate <quantity ?? 5> creative, age-appropriate <activityType> activities for students in <ageGroup> learning about <subject>." … "Make them engaging, hands-on, and appropriate for the age group." `base44/functions/generateActivities/entry.ts:12-53`; caller `src/components/ActivityGenerator.jsx:77-82` |

### A.1 Index of all 21 backend functions

| Function | Specified in |
|---|---|
| `autoSync`, `syncGoogleCalendarToApp`, `syncGoogleTasks`, `syncAppEventToGoogle`, `syncTasksToCalendar`, `updateGoogleTask`, `getGoogleCalendars`, `getGoogleTaskLists`, `checkConnectorStatus`, `deleteToDoItem` | `google-sync.md` §A (behaviour of `deleteToDoItem` in `schedule-hub.md` §8) |
| `generateDailyQuotes`, `makeImagesDefaults`, `backfillDefaultImagesToAllUsers`, `clearChoreLibraryAssignments`, `initializeDefaultCollageImages`, `deduplicateCalendarEvents`, `deleteSyncedData`, `deleteUserAccount`, `fetchDailyQuote`, `generateChores`, `generateActivities` | this document §2 and §A |
