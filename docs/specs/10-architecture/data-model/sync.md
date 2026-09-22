# Data Model — Google Sync State

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### SelectedCalendars   (E-SelectedCalendars)

**Purpose.** One row per Google calendar the account has seen, holding the import opt-in and last import
time. `[Implemented]` `base44/entities/SelectedCalendars.jsonc:1-38`

**Source file.** `base44/entities/SelectedCalendars.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/SelectedCalendars.jsonc:24-37`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:73-75`

**Cardinality.** One per Google `calendar_id` per owner by convention: the list function creates rows only
for calendars not already saved. `[Implemented]` `base44/functions/getGoogleCalendars/entry.ts:25-42`

**Writers.** create: `base44/functions/getGoogleCalendars/entry.ts:35`. update: `base44/functions/autoSync/entry.ts:49,63`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:75,156`, `src/pages/Settings.jsx:544`. delete:
`base44/functions/deleteSyncedData/entry.ts:52,71`, `base44/functions/deleteUserAccount/entry.ts:73-75`.
**Readers.** `base44/functions/autoSync/entry.ts:26`, `base44/functions/syncGoogleCalendarToApp/entry.ts:22`
(`filter({ is_selected: true })`), `base44/functions/getGoogleCalendars/entry.ts:26` (`filter({ created_by })`),
`src/pages/Settings.jsx:298` (`filter({})`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `calendar_id` | string | yes | — | Google calendar id | Which calendar | `getGoogleCalendars:36` | fetch URLs `autoSync:40`, `syncGoogleCalendarToApp:61`; written to `ScheduleItem.google_calendar_id` `:119` |
| `calendar_name` | string | yes | — | Google `summary` | Display name | `getGoogleCalendars:37` | Settings list |
| `is_selected` | boolean | no | `true` | — | Import opt-in | `getGoogleCalendars:38` (`cal.primary \|\| false`), `Settings.jsx:544` (toggle), `autoSync:49` and `syncGoogleCalendarToApp:75` (`false` on HTTP 404) | import filters |
| `last_synced` | string | no | — | ISO date-time | Last successful import | `autoSync:63` (calendars fetched OK), `syncGoogleCalendarToApp:156` (per calendar after processing) | Settings display, `getGoogleCalendars:52` |

**References out.** `calendar_id` → Google. **Referenced by.** `ScheduleItem.google_calendar_id` (by
`calendar_id`); `ThemeSettings.auto_sync_calendar_ids` holds this entity's row ids. `[Implemented]`
`base44/functions/syncGoogleCalendarToApp/entry.ts:119`, `src/pages/Settings.jsx:300-306,513-518`

**Lifecycle.** *Created* on "fetch calendars" for each new Google calendar, selected only if primary;
*updated* by the Settings toggle, by imports (`last_synced`), and set unselected when Google returns 404;
*hard-deleted* by the synced-data wipe, full wipe, and account deletion. `[Implemented]`
`base44/functions/getGoogleCalendars/entry.ts:32-42`, `src/pages/Settings.jsx:541-547`,
`base44/functions/autoSync/entry.ts:47-50,62-65`, `base44/functions/syncGoogleCalendarToApp/entry.ts:72-79,156`,
`base44/functions/deleteSyncedData/entry.ts:52,71`

**Ordering & read-time sort/limit.** Unsorted, unlimited. **Denormalised caches.** `calendar_name` is a copy
of Google's summary, refreshed only in the merged response, not in the row. `[Implemented]`
`base44/functions/getGoogleCalendars/entry.ts:45-54` **Retention.** Indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

### SelectedTaskLists   (E-SelectedTaskLists)

**Purpose.** One row per Google task list seen, with an opt-in flag. `[Implemented]` `base44/entities/SelectedTaskLists.jsonc:1-38`

**Source file.** `base44/entities/SelectedTaskLists.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/SelectedTaskLists.jsonc:24-37`

**Service-role bypasses.** None. In the full-wipe list; absent from the synced-data path and from
`deleteUserAccount`. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:52,69-75`,
`base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** One per Google `list_id` per owner by convention. `[Implemented]` `base44/functions/getGoogleTaskLists/entry.ts:29-42`

**Writers.** create: `base44/functions/getGoogleTaskLists/entry.ts:35`. update: `src/pages/Settings.jsx:553`.
delete: `base44/functions/deleteSyncedData/entry.ts:52`.
**Readers.** `base44/functions/getGoogleTaskLists/entry.ts:29,48`, `src/pages/Settings.jsx:318`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `list_id` | string | yes | — | Google task-list id | Which list | `getGoogleTaskLists:36` | matching `:30,47`, `Settings.jsx:321` |
| `list_name` | string | yes | — | Google list title | Display name | `getGoogleTaskLists:37` | Settings display |
| `is_selected` | boolean | no | `true` | — | Opt-in shown in Settings | `getGoogleTaskLists:38` (`true`), `Settings.jsx:553` | `getGoogleTaskLists:51`, `Settings.jsx:323`; the task import functions iterate every Google list without consulting it (`autoSync:126`, `syncGoogleTasks:39`) |
| `last_synced` | string | no | — | ISO date-time | Declared; never written | none | none |

**References out.** `list_id` → Google. **Referenced by.** None.

**Lifecycle.** *Created* on "fetch task lists" for each new list; *updated* by the Settings toggle;
*hard-deleted* only by the full wipe. `[Implemented]` `base44/functions/getGoogleTaskLists/entry.ts:32-42`,
`src/pages/Settings.jsx:549-556`, `base44/functions/deleteSyncedData/entry.ts:52`

**Ordering & read-time sort/limit.** Unsorted, unlimited. **Denormalised caches / Retention.** `list_name`
copy / indefinite.

**Declared-but-unwritten fields.** `last_synced`. `[Implemented]` `base44/entities/SelectedTaskLists.jsonc:15-18`
**Written-but-undeclared / Required-but-written-empty.** None observed.

---

### SyncState   (E-SyncState)

**Purpose.** Last-sync bookkeeping: when, which source, and which Google account. `[Implemented]`
`base44/entities/SyncState.jsonc:1-34`

**Source file.** `base44/entities/SyncState.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/SyncState.jsonc:20-33`

**Service-role bypasses.** `syncTasksToCalendar` lists and updates/creates through `asServiceRole` with no
owner filter, taking the first row returned. `deleteUserAccount` deletes by `created_by`. `[Implemented]`
`base44/functions/syncTasksToCalendar/entry.ts:93-106`, `base44/functions/deleteUserAccount/entry.ts:76-78`

**Cardinality.** Singleton by convention: readers take `list('-updated_date', 1)` and update that row or
create one. `[Implemented]` `base44/functions/autoSync/entry.ts:97-103`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:185-191`, `src/pages/Settings.jsx:359-367`

**Writers.** create: `base44/functions/autoSync/entry.ts:102`, `base44/functions/syncGoogleCalendarToApp/entry.ts:190`,
`base44/functions/syncTasksToCalendar/entry.ts:101`. update: `base44/functions/autoSync/entry.ts:100`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:188`, `base44/functions/syncTasksToCalendar/entry.ts:95`.
delete: `base44/functions/deleteSyncedData/entry.ts:51,73`, `base44/functions/deleteUserAccount/entry.ts:76-78`.
**Readers.** `base44/functions/autoSync/entry.ts:97`, `base44/functions/syncGoogleCalendarToApp/entry.ts:186`,
`base44/functions/syncTasksToCalendar/entry.ts:93`, `src/pages/Settings.jsx:361`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `sync_token` | string | no | — | — | Declared; never written | none | none |
| `last_sync` | string | no | — | ISO date-time | Last run | all writers | Settings display |
| `source` | string | no | — | `googlecalendar` (calendar imports) · `tasks` (tasks-to-calendar push) | Which run wrote it | `autoSync:98`, `syncGoogleCalendarToApp:185`, `syncTasksToCalendar:97,103` | Settings display |
| `synced_account_email` | string | no | — | the app user's email (imports) or the Google profile email (push) | Account that synced | `autoSync:98`, `syncGoogleCalendarToApp:185` (`user.email`), `syncTasksToCalendar:98,104` (`profile.email` or `''`) | Settings display |

**References out / Referenced by.** None.

**Lifecycle.** *Created* on the first import or push; *updated* on every subsequent one; *hard-deleted* by the
synced-data wipe, full wipe, and account deletion. `[Implemented]` `base44/functions/autoSync/entry.ts:97-103`,
`base44/functions/deleteSyncedData/entry.ts:51,73`

**Ordering & read-time sort/limit.** `-updated_date` 1, or unsorted `list()` first row (push). **Denormalised
caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** `sync_token`. `[Implemented]` `base44/entities/SyncState.jsonc:5-7`
**Written-but-undeclared / Required-but-written-empty.** None observed.

---

### DeletedSyncItem   (E-DeletedSyncItem)

**Purpose.** A tombstone for a Google item that disappeared, awaiting the user's Allow / Deny decision.
`[Implemented]` `base44/entities/DeletedSyncItem.jsonc:1-61`, `src/components/DeletedItemReview.jsx:7-100`

**Source file.** `base44/entities/DeletedSyncItem.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/DeletedSyncItem.jsonc:47-60`

**Service-role bypasses.** None. In the full-wipe list; absent from the synced-data path and from
`deleteUserAccount`. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:52`

**Cardinality.** Undetermined: no create path exists in `src/` or `base44/functions/`. `[Partial]`
`base44/entities/DeletedSyncItem.jsonc:1-61`

**Writers.** update: `src/components/DeletedItemReview.jsx:25,45`. delete: `base44/functions/deleteSyncedData/entry.ts:52`.
create: none.
**Readers.** `src/components/DeletedItemReview.jsx:18` (`filter({ status: 'pending_review' }, '-last_detected', 100)`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `source_type` | string | yes | — | `calendar` · `task` | Kind of Google item | none | `DeletedItemReview.jsx:34` (only `calendar` is recreated) |
| `google_id` | string | yes | — | Google event or task id | The vanished item | none | `DeletedItemReview.jsx:41` (becomes `ScheduleItem.source_id`) |
| `title` | string | yes | — | free text | Title | none | `DeletedItemReview.jsx:36` |
| `sync_source` | string | yes | — | which sync detected it | Detector | none | none |
| `last_detected` | string | no | — | ISO date-time | Last seen missing | none | sort key `:18` |
| `status` | string | no | `pending_review` | `pending_review` · `denied` · `allowed` | User decision | `DeletedItemReview.jsx:25` (`allowed`), `:45` (`denied`) | filter `:18` |

**References out.** `google_id` → Google. **Referenced by.** A denied `calendar` tombstone is recreated as a
`ScheduleItem` for today 09:00–10:00 with `source_type: 'calendar'`, `source_id: google_id`, colour `#3b82f6`.
`[Implemented]` `src/components/DeletedItemReview.jsx:30-48`

**Lifecycle.** *Created*: none observed `[Partial]`. *Allowed*: `status: 'allowed'`. *Denied*: schedule item
recreated (calendar only), then `status: 'denied'`. *Hard-deleted* by the full wipe. `[Implemented]`
`src/components/DeletedItemReview.jsx:23-48`, `base44/functions/deleteSyncedData/entry.ts:52`

**Ordering & read-time sort/limit.** `-last_detected` 100 filtered on `pending_review`. **Denormalised
caches / Retention.** `title` copy / indefinite.

**Declared-but-unwritten fields.** `source_type`, `google_id`, `title`, `sync_source`, `last_detected` (no
creator). **Written-but-undeclared / Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-008** (see `schedule.md`) Scheduled import stores no Google ids on calendar rows; manual import stores
  both and its deletion rule requires both.
- **D-010** `SyncState` scope: the tasks-to-calendar push reads and writes `SyncState` via service role with no
  owner filter, taking the first row of an unsorted `list()` (`base44/functions/syncTasksToCalendar/entry.ts:93-106`);
  the calendar imports use the caller-scoped client with `list('-updated_date', 1)`
  (`base44/functions/autoSync/entry.ts:97-103`, `base44/functions/syncGoogleCalendarToApp/entry.ts:185-191`).
- **Q-005** Blocks: `DeletedSyncItem` lifecycle "created". No function or component creates tombstone rows;
  the review UI, the entity, and the full-wipe list reference them. Whether a producer exists outside the
  repository is not visible.
