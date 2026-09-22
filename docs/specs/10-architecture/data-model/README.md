# Data Model — Conventions

**Area:** `DATA` · **Level:** 2 · **Status:** draft

This folder documents the 30 entities declared in `base44/entities/*.jsonc` exactly as the prototype
declares and uses them. `../domain-model.md` is the Level 1 catalogue; the files beside this README
are the Level 2 entity sheets. Every statement is tagged `[Implemented]`, `[Described]`, or `[Partial]`
and cites `path:line-range` relative to the repository root.

Entity sheets in this folder:

| File | Entities |
|---|---|
| `tasks.md` | Task, TrashBin |
| `schedule.md` | ScheduleItem |
| `chores.md` | Chore, ChoreLibrary, ChoreUser |
| `goals.md` | Goal, GoalTask |
| `checklist.md` | DailyChecklist, ChecklistCompletion, DailyGratitude |
| `education.md` | Learner, EducationPlan, EducationActivity, FavoriteActivity |
| `vision-board.md` | HealthPillar, PillarActivity, DailyPillarTracking, Affirmation, CollageImage, UserCollageImage |
| `quotes-links.md` | DailyQuote, Link |
| `sync.md` | SelectedCalendars, SelectedTaskLists, SyncState, DeletedSyncItem |
| `settings.md` | ThemeSettings, ReminderSettings, User |
| `relationships.md` | every reference, polymorphic link, cache, and cascade |
| `json-string-fields.md` | inner shape of every serialised field |
| `flags-and-lifecycle.md` | visibility flags, ordering fields, retention, read limits |

## 1. Implicit fields

- **AR-DATA-01** Every entity row carries four fields that no `.jsonc` file declares: `id` (string, the
  row key), `created_by` (the account owner's email), `created_date`, and `updated_date` (ISO date-time
  strings). Code reads all four. `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:20`,
  `base44/functions/deduplicateCalendarEvents/entry.ts:28`, `src/pages/DailySchedule.jsx:1052`,
  `base44/functions/getGoogleCalendars/entry.ts:26`
- `created_by` is set by the platform from the caller; service-role writes may supply it explicitly
  (see §3). `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:81-87`,
  `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:44-46`
- Client code sometimes spreads a whole existing row back into a create or update, which re-sends the
  implicit fields as part of the payload (Task restore from trash, chore copy on bulk reassign, activity
  edit, theme save). `[Implemented]` `src/pages/Settings.jsx:203-204`, `src/pages/Chores.jsx:522`,
  `src/components/education/SubjectCard.jsx:128-130`, `src/pages/ThemeEditor.jsx:88-89,163-166`

## 2. Row-level scoping

- **AR-DATA-02** Twenty-eight entities declare the same row-level rule for all four operations, verbatim:

  ```json
  "rls": {
    "create": { "created_by": "{{user.email}}" },
    "read":   { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
  ```

  `[Implemented]` e.g. `base44/entities/Task.jsonc:96-109`, `base44/entities/ScheduleItem.jsonc:74-87`
- **AR-DATA-03** Two entities widen every operation to also allow any user whose `role` is `admin`, verbatim:

  ```json
  "create": { "$or": [ { "created_by": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] }
  ```

  (the same `$or` is repeated for `read`, `update`, `delete`). `[Implemented]`
  `base44/entities/DailyGratitude.jsonc:19-68`, `base44/entities/PillarActivity.jsonc:28-77`
- `User` declares no `rls` block; it only extends the platform user with `role`. `[Implemented]`
  `base44/entities/User.jsonc:1-17`
- The account owner is the only tenant boundary. Household members, learners, and goal members are
  plain rows (or plain strings) inside one owner's data, not logins. `[Implemented]`
  `base44/entities/ChoreUser.jsonc:5-13`, `base44/entities/Learner.jsonc:5-16`,
  `base44/entities/Goal.jsonc:48-50`

## 3. Service-role writes

- **AR-DATA-04** Backend functions may act through `base44.asServiceRole`, which is not subject to the
  row rule above. The functions that read or write entities this way, and what they touch:

| Function | Service-role reads | Service-role writes | Guard |
|---|---|---|---|
| `syncGoogleTasks` | `Task` filtered on `google_task_id` + `created_by` | `Task` create/update | authenticated user; filter includes caller email `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:53-73` |
| `syncTasksToCalendar` | `SyncState` (no owner filter) | `SyncState` create/update | authenticated user `[Implemented]` `base44/functions/syncTasksToCalendar/entry.ts:93-106` |
| `deleteToDoItem` | `ScheduleItem`, `Task`, `Chore`, `EducationActivity`, `GoalTask` by id | update/delete of the same | every row is re-checked for `created_by === user.email` before any write; a foreign row returns 403 `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:9-22,42-44,51-66,72-97` |
| `deleteUserAccount` | 16 entities filtered on `created_by` | delete of the same, then `auth.deleteUser` | authenticated user `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:31-81` |
| `generateDailyQuotes` | `User` (all), `DailyQuote` filtered on `created_by` | `DailyQuote` create with explicit `created_by` | caller `role === 'admin'` `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:16-18,23,30-37,81-87` |
| `initializeDefaultCollageImages` | `CollageImage` where `is_default: true` across all owners | none (the copy is written as the caller) | authenticated user `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:20,38` |
| `makeImagesDefaults` | none | `CollageImage.is_default = true` on the caller's own rows | `role === 'admin'` `[Implemented]` `base44/functions/makeImagesDefaults/entry.ts:12-14,31` |
| `backfillDefaultImagesToAllUsers` | `CollageImage` (all), `User` (all), `CollageImage` per user | `CollageImage.bulkCreate` with explicit `created_by` | `role === 'admin'` `[Implemented]` `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:8-10,13,21,29,44-46` |
| `clearChoreLibraryAssignments` | `ChoreLibrary` (all, 500) | `ChoreLibrary.update({ assigned_to: null })` | `role === 'admin'` `[Implemented]` `base44/functions/clearChoreLibraryAssignments/entry.ts:12-23` |

- All other backend functions use the caller-scoped client, so the row rule applies to them.
  `[Implemented]` `base44/functions/autoSync/entry.ts:15-140`, `base44/functions/syncGoogleCalendarToApp/entry.ts:22-190`,
  `base44/functions/fetchDailyQuote/entry.ts:16-82`, `base44/functions/getGoogleCalendars/entry.ts:26-41`,
  `base44/functions/getGoogleTaskLists/entry.ts:29-48`, `base44/functions/deduplicateCalendarEvents/entry.ts:7-34`,
  `base44/functions/deleteSyncedData/entry.ts:47-75`, `base44/functions/syncAppEventToGoogle/entry.ts:58-61`

## 4. References

- **AR-DATA-05** No entity file declares a foreign-key constraint. Every reference is a plain string
  holding another row's `id`, another row's display name, or an external Google identifier. See
  `relationships.md`. `[Implemented]` `base44/entities/GoalTask.jsonc:5-7`, `base44/entities/Chore.jsonc:11-13`,
  `base44/entities/ScheduleItem.jsonc:28-30,62-67`

## 5. Value formats

- **AR-DATA-07** Calendar dates are strings `YYYY-MM-DD` (`"format": "date"` in the schema; built in code
  with `format(date, "yyyy-MM-dd")` or `toISOString().split('T')[0]`). `[Implemented]`
  `base44/entities/Task.jsonc:30-33`, `src/components/DailyToDo.jsx:35`, `src/pages/Chores.jsx:321`
- **AR-DATA-08** Clock times are strings `HH:MM` 24-hour (`start_time`, `end_time`, `due_time`,
  `schedule_time`, `time_of_day`, `ReminderSettings.times[]`, `ThemeSettings.sync_times`). `[Implemented]`
  `src/pages/DailySchedule.jsx:378`, `base44/functions/autoSync/entry.ts:78-85`,
  `base44/entities/ReminderSettings.jsonc:10-17`
- Date-times are ISO strings from `new Date().toISOString()` (`completed_at`, `started_at`, `deleted_at`,
  `last_synced`, `last_sync`, `last_detected`). `[Implemented]` `src/pages/Tasks.jsx:352`,
  `src/pages/Goals.jsx:174-175`, `base44/functions/syncGoogleCalendarToApp/entry.ts:156`
- One exception: `Task.schedule_time` is declared as a plain string and is written as an `HH:MM` value by
  the Daily Schedule and as a full ISO date-time by the tasks-to-calendar push. `[Implemented]`
  `src/pages/DailySchedule.jsx:440`, `base44/functions/syncTasksToCalendar/entry.ts:84`
- `UserCollageImage.signed_url_expires` is a number: epoch milliseconds. `[Implemented]`
  `src/components/visionboard/PrivateImageUploader.jsx:17`
- **AR-DATA-09** Colours are CSS hex strings such as `#3b82f6` (`category_color`, `label_color`,
  `ChoreUser.color`, `Learner.color`, `HealthPillar.color`, `ScheduleItem.color`, theme colours, link icon
  colour). `[Implemented]` `base44/entities/DailyChecklist.jsonc:34-37`, `src/pages/VisionBoard.jsx:30-46`,
  `base44/functions/syncGoogleCalendarToApp/entry.ts:121`
- **AR-DATA-10** Several string fields hold serialised JSON or delimited text. Their inner shapes are in
  `json-string-fields.md`. `[Implemented]` `base44/entities/ThemeSettings.jsonc:67-94`,
  `base44/entities/Task.jsonc:88-91`, `base44/entities/TrashBin.jsonc:16-19`
- Day-of-week arrays use two conventions: three-letter names `Mon`..`Sun` for `Task.days_of_week`,
  `EducationActivity.days_of_week`, and meal chores; full names `Monday`..`Sunday` for non-meal chores.
  `[Implemented]` `src/pages/Tasks.jsx:492`, `base44/entities/EducationActivity.jsonc:40-54`,
  `src/components/ChoreGenerator.jsx:15,166`, `src/pages/Chores.jsx:22,343-345`

## 6. Singletons by convention

- **AR-DATA-06** `ThemeSettings` and `SyncState` have no uniqueness rule. Readers take the most recently
  updated row: `list("-updated_date", 1)`. Writers update that row if one exists and otherwise create a
  new one. `[Implemented]` `src/App.jsx:87`, `src/pages/Settings.jsx:274,361`,
  `base44/functions/autoSync/entry.ts:15,97-103`, `src/pages/Dashboard.jsx:119,146-150`,
  `src/components/GenericOnboardingDialog.jsx:10-22`
- One reader of `SyncState` uses `list()` with no sort and takes the first row. `[Implemented]`
  `base44/functions/syncTasksToCalendar/entry.ts:93-95`
- `ReminderSettings` is read the same way (`list()`, first row). `[Implemented]`
  `src/components/dashboard/DashboardFocalAreas.jsx:32,65`

## 7. One-per-date conventions

- **AR-DATA-11** `DailyQuote`, `DailyGratitude`, and `ChecklistCompletion`/`DailyPillarTracking` (per item
  or pillar) are kept to one row per date by read-then-update-or-create logic in code, not by the schema.
  `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:20-28`,
  `src/components/visionboard/DailyEvaluation.jsx:125-140,147-152`, `src/pages/DailyChecklist.jsx:151-156`

## 8. Read limits and sort orders

- **AR-DATA-12** Calls take the form `filter(query, sort, limit)` or `list(sort, limit)`. A leading `-`
  on the sort field means descending. Limits observed range from 1 to 10000. The full table is in
  `flags-and-lifecycle.md` §5. `[Implemented]` `src/pages/Tasks.jsx:141`,
  `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13`

## 9. Cascades

- **AR-DATA-13** All cascade behaviour is written in client or function code; the schema declares none.
  The table of implemented cascades is in `relationships.md` §5. `[Implemented]`
  `src/pages/Education.jsx:214-220`, `src/pages/Tasks.jsx:253-256`

## 10. Entity sheet template

Each entity sheet uses this structure:

```
### <Entity>   (E-<Name>)
Purpose · Source file · Declared RLS · Service-role bypasses · Cardinality & enforcing convention
| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
References out · Referenced by
Lifecycle: created / updated / completed-or-reset / dismissed / soft-deleted / hard-deleted / purged
Ordering & read-time sort/limit · Denormalised caches and refresh rule · Retention
Declared-but-unwritten fields · Written-but-undeclared fields · Required-but-written-empty
```

"Written by" and "Read by" cells list the call sites that pass or consume the field. Where a cell would
repeat an entity-wide list, it says "all writers" or "all readers" and the entity's write/read list at
the top of the sheet applies.
