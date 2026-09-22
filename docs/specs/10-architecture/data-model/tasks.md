# Data Model — Tasks

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### Task   (E-Task)

**Purpose.** A to-do item: title, notes, priority, optional due date and time, a free-text label with
colour, a recurrence pattern or an occurrence count, optional resource links, and optional identifiers
tying it to Google Tasks or to a Google Calendar event. `[Implemented]` `base44/entities/Task.jsonc:1-110`

**Source file.** `base44/entities/Task.jsonc`

**Declared RLS.** The standard four-operation `created_by: {{user.email}}` rule (verbatim in `README.md` §2).
`[Implemented]` `base44/entities/Task.jsonc:96-109`

**Service-role bypasses.** `syncGoogleTasks` filters, updates, and creates through `asServiceRole`, with the
caller's email in the filter. `deleteToDoItem` reads/updates/deletes through `asServiceRole` after an
ownership check. `deleteUserAccount` deletes through `asServiceRole` filtered on `created_by`. `[Implemented]`
`base44/functions/syncGoogleTasks/entry.ts:53-73`, `base44/functions/deleteToDoItem/entry.ts:53,63,97,110`,
`base44/functions/deleteUserAccount/entry.ts:31-33`

**Cardinality.** Many per account owner. No uniqueness rule. Two conventions limit duplicates in code:
Google import upserts on `google_task_id` `[Implemented]` `base44/functions/autoSync/entry.ts:134-141`,
`base44/functions/syncGoogleTasks/entry.ts:53-73`; the Tasks page deletes duplicate pending recurring tasks
sharing `title` + `recurrence_pattern`, keeping the earliest `due_date` `[Implemented]` `src/pages/Tasks.jsx:93-121`.

**Writers (entity-wide).** create: `src/pages/Tasks.jsx:218,306`, `src/pages/DailySchedule.jsx:397,420,855,873`,
`src/pages/Settings.jsx:204`, `base44/functions/autoSync/entry.ts:140`, `base44/functions/syncGoogleTasks/entry.ts:72`.
update: `src/pages/Tasks.jsx:236,247`, `src/components/TaskEditDialog.jsx:85`, `src/components/DailyToDo.jsx:119,159`,
`src/components/dashboard/DashboardTasks.jsx:76`, `src/pages/DailySchedule.jsx:440`,
`base44/functions/deleteToDoItem/entry.ts:63`, `base44/functions/autoSync/entry.ts:137`,
`base44/functions/syncGoogleTasks/entry.ts:69`, `base44/functions/syncTasksToCalendar/entry.ts:81`.
delete: `src/pages/Tasks.jsx:114,333,361`, `src/components/DailyToDo.jsx:189`,
`base44/functions/deleteToDoItem/entry.ts:97,110`, `base44/functions/deleteSyncedData/entry.ts:25-28,61-62`,
`base44/functions/deleteUserAccount/entry.ts:31-33`.

**Readers (entity-wide).** `src/pages/Tasks.jsx:94,141,260`, `src/components/DailyToDo.jsx:37,294`,
`src/pages/DailySchedule.jsx:235`, `src/components/dashboard/DashboardTasks.jsx:52,128`,
`base44/functions/syncTasksToCalendar/entry.ts:29-31`, `base44/functions/autoSync/entry.ts:134`,
`base44/functions/syncGoogleTasks/entry.ts:53-56`, `base44/functions/deleteToDoItem/entry.ts:13`.
subscribe: `src/pages/Tasks.jsx:128`, `src/components/DailyToDo.jsx:98`, `src/pages/DailySchedule.jsx:185`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text | Task name | all creators; `TaskEditDialog.jsx:86`; sync writes Google title or `'Untitled'` (`autoSync:135`, `syncGoogleTasks:59`) | all readers |
| `description` | string | no | — | free text | Notes | `Tasks.jsx:211` (form), `Tasks.jsx:308`, `TaskEditDialog.jsx:92` (dialog field "notes"), sync from Google `notes` | `DailyToDo.jsx:66`, `syncTasksToCalendar:43`, `TaskEditDialog.jsx:42` |
| `status` | string | no | `pending` | `pending` · `in_progress` · `completed` | Completion state | `DailySchedule.jsx:399,422,857,875` (`pending`); toggles `Tasks.jsx:238,248`, `DailyToDo.jsx:120`, `DashboardTasks.jsx:77`; sync maps Google `completed` → `completed`, else `pending` (`autoSync:135`, `syncGoogleTasks:61`) | filters `Tasks.jsx:168-197`, `DashboardTasks.jsx:52,62`, `syncTasksToCalendar:30`, `DailyToDo.jsx:65` |
| `priority` | string | no | `medium` | `low` · `medium` · `high` · `urgent` | Priority | `Tasks.jsx:211` (form default `medium`), `Tasks.jsx:309`, `TaskEditDialog.jsx:87`, `DailySchedule.jsx:423` | `DailyToDo.jsx:47,64`, `DailySchedule.jsx:331`, `syncTasksToCalendar:53` |
| `due_date` | string | no | — | `YYYY-MM-DD`; `null` clears | Due date; absent means "in the library, unscheduled" | `Tasks.jsx:212` (`null` when blank), `Tasks.jsx:312`, `TaskEditDialog.jsx:88`, `DailySchedule.jsx:440`, `DailyToDo.jsx:160` (`null`), `deleteToDoItem:63` (`null`), sync (`gtask.due` truncated to date, `autoSync:135`, `syncGoogleTasks:63`) | `Tasks.jsx:167-192`, `DailyToDo.jsx:54`, `DashboardTasks.jsx:64-66`, `src/lib/recurringTaskUtils.js:9-34`, `syncTasksToCalendar:39-49` |
| `due_time` | string | no | — | `HH:MM` | Due time | `Tasks.jsx:211`, `Tasks.jsx:313`, `TaskEditDialog.jsx:89`, `DailyToDo.jsx:161` (`null`), `deleteToDoItem:63` (`null`) | `DailyToDo.jsx:62`, `syncTasksToCalendar:59-67` |
| `category` | string | no | — | free-text label; values written by code: `Google Tasks`, `Custom`, `Quick Task` | Label | `Tasks.jsx:211`, `Tasks.jsx:310`, `TaskEditDialog.jsx:90`, `DailySchedule.jsx:400,424` (`Custom`), `DailySchedule.jsx:858,876` (`Quick Task`), `autoSync:135` (`'Google Tasks'`), `syncGoogleTasks:64` (`ThemeSettings.task_sync_category` or `'Google Tasks'`) | grouping via `src/lib/categoryUtils.js`, `syncTasksToCalendar:54` |
| `category_color` | string | no | — | hex | Label colour | `Tasks.jsx:211`, `Tasks.jsx:311`, `TaskEditDialog.jsx:91`, `syncGoogleTasks:65` (`ThemeSettings.task_sync_color` or `''`) | label rendering |
| `is_recurring` | boolean | no | `false` | — | Whether a recurrence pattern applies | `Tasks.jsx:213` (`frequency !== "one-time"`), `Tasks.jsx:314` (`true`), `TaskEditDialog.jsx:94` | `Tasks.jsx:96,190,231,258`, `recurringTaskUtils.js:14` |
| `recurrence_pattern` | string | no | — | `daily` · `weekly` · `biweekly` · `monthly` · `days_of_week` · `occurrences`; `null` when not recurring | How the task repeats | `Tasks.jsx:214`, `Tasks.jsx:315`, `TaskEditDialog.jsx:95` | `Tasks.jsx:148-163,231,269-304`, `recurringTaskUtils.js:16-41` |
| `occurrences` | number | no | `1` | integer ≥ 1; `null` written for non-occurrence tasks | Times the task must be completed | `Tasks.jsx:215`, `TaskEditDialog.jsx:97` | `Tasks.jsx:233` |
| `completed_count` | number | no | `0` | integer; `null` written for non-occurrence tasks | Completions so far | `Tasks.jsx:216,237` | `Tasks.jsx:232` |
| `days_of_week` | string[] | no | — | items `Mon`..`Sun` | Days for `weekly` / `days_of_week` patterns | `Tasks.jsx:211` (form), `Tasks.jsx:316`, `TaskEditDialog.jsx:96` (emptied unless pattern is weekly or days_of_week) | `Tasks.jsx:271-302` |
| `last_completed_date` | string | no | — | `YYYY-MM-DD`; `null` on un-complete | Last completion date; drives period checks | `Tasks.jsx:239,249`, `DailyToDo.jsx:121` | `Tasks.jsx:145-165`, `recurringTaskUtils.js:36-39` |
| `google_task_id` | string | no | — | Google Tasks task id, or a Google Calendar event id | External link | `autoSync:135`, `syncGoogleTasks:62` (task id); `syncTasksToCalendar:82` (calendar event id) | `Tasks.jsx:340,348`, `TaskEditDialog.jsx:114-116`, `deleteToDoItem:104-106`, `deleteSyncedData:25` |
| `synced_to_schedule` | boolean | no | `false` | — | Set true only by the tasks-to-calendar push; cleared when sent back to the library | `syncTasksToCalendar:83` (`true`), `DailyToDo.jsx:163`, `deleteToDoItem:63` (`false`) | none observed |
| `schedule_time` | string | no | — | `HH:MM` from the schedule; ISO date-time from the calendar push | Time placed on the schedule | `DailySchedule.jsx:440`, `syncTasksToCalendar:84`, `DailyToDo.jsx:162`, `deleteToDoItem:63` (`null`) | none observed |
| `links` | string | no | — | JSON array of URL strings (see `json-string-fields.md`) | Resource links | `TaskEditDialog.jsx:93` | `TaskEditDialog.jsx:37,59`, `Tasks.jsx:655` |

**References out.** `google_task_id` → Google Tasks (`lists/@default/tasks/{id}`) or Google Calendar event
(see `json-string-fields.md` §0 for which writer). No id references to other entities. `[Implemented]`
`base44/functions/deleteToDoItem/entry.ts:106`, `base44/functions/syncTasksToCalendar/entry.ts:70-82`

**Referenced by.** `ScheduleItem.source_id` when `source_type` is `task` or `custom` `[Implemented]`
`src/pages/DailySchedule.jsx:417-436`, `src/components/DailyToDo.jsx:46`; `TrashBin.item_id` `[Implemented]`
`src/pages/Tasks.jsx:355`; virtual to-do rows `due-task-<id>` `[Implemented]` `src/components/DailyToDo.jsx:56-67`.

**Lifecycle.**
- *Created* from the Tasks form; `due_date` blank becomes `null`; `is_recurring` derives from the form's
  frequency; `occurrences`/`completed_count` are `null` unless the pattern is `occurrences`. `[Implemented]`
  `src/pages/Tasks.jsx:201-222`
- *Created* as the next occurrence when a recurring task is completed and no pending task with the same
  `title` + `recurrence_pattern` exists; next `due_date` is +1 day (daily), next listed weekday or +7
  (weekly), +14 (biweekly), next listed weekday or +1 (days_of_week), +1 month (monthly). `[Implemented]`
  `src/pages/Tasks.jsx:258-318`
- *Created* by the Daily Schedule for custom blocks (`category: "Custom"`) and quick tasks
  (`category: "Quick Task"`) with `status: "pending"`. `[Implemented]` `src/pages/DailySchedule.jsx:395-408,419-427,853-884`
- *Created / updated* by Google import, upserting on `google_task_id`; hidden Google tasks are skipped.
  `[Implemented]` `base44/functions/autoSync/entry.ts:132-142`, `base44/functions/syncGoogleTasks/entry.ts:49-75`
- *Created* on restore from trash from the stored snapshot minus `id`. `[Implemented]` `src/pages/Settings.jsx:197-208`
- *Updated* by the edit dialog (all editable fields plus `links`); if `due_date`/`due_time` changed, linked
  schedule items get `date`/`start_time`; if `google_task_id` and the sync switch is on, the Google task's
  due is pushed. `[Implemented]` `src/components/TaskEditDialog.jsx:81-120`
- *Updated* when placed on the schedule: `due_date` = selected date, `schedule_time` = start time.
  `[Implemented]` `src/pages/DailySchedule.jsx:439-441`
- *Completed* (Tasks page): `status` toggles, `last_completed_date` = today or `null`; linked schedule items
  get `completed`. Occurrence tasks instead increment/decrement `completed_count` and complete when the
  count reaches `occurrences`. `[Implemented]` `src/pages/Tasks.jsx:226-257`
- *Completed* (to-do): `status` + `last_completed_date`, and the real schedule item gets `completed` and
  `hidden_from_grid`. `[Implemented]` `src/components/DailyToDo.jsx:107-144`
- *Completed* (dashboard widget): `status` only. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:75-80`
- *Sent back to the library*: `due_date`, `due_time`, `schedule_time` → `null`, `synced_to_schedule` →
  `false`, and the schedule item is deleted. `[Implemented]` `src/components/DailyToDo.jsx:156-169`,
  `base44/functions/deleteToDoItem/entry.ts:49-67`
- *Soft-deleted*: a single delete from the Tasks page first writes a `TrashBin` snapshot, then hard-deletes.
  `[Implemented]` `src/pages/Tasks.jsx:347-367`
- *Hard-deleted* without snapshot: batch delete, recurring dedup, to-do "delete_app", "delete_google"
  (after deleting the Google task), synced-data wipe (rows where `google_task_id` exists), full wipe,
  account deletion. `[Implemented]` `src/pages/Tasks.jsx:114,333`, `src/components/DailyToDo.jsx:189`,
  `base44/functions/deleteToDoItem/entry.ts:97,102-111`, `base44/functions/deleteSyncedData/entry.ts:22-36,61-62,75`,
  `base44/functions/deleteUserAccount/entry.ts:31-33`
- *Purged*: none beyond the recurring dedup above.

**Ordering & read-time sort/limit.** `-created_date` with limits 100 (Tasks page), 200 (dedup, to-do,
dashboard), 500 (dashboard print); `-updated_date` 100 (Daily Schedule); `-created_date` 100 with
`status: { $ne: 'completed' }` (calendar push). `[Implemented]` `src/pages/Tasks.jsx:94,141`,
`src/components/DailyToDo.jsx:37`, `src/components/dashboard/DashboardTasks.jsx:52,128`,
`src/pages/DailySchedule.jsx:235`, `base44/functions/syncTasksToCalendar/entry.ts:29-31`

**Denormalised caches.** `ScheduleItem.title` copies the task title at placement time and is not refreshed
when the task title changes (only `date`/`start_time` are propagated). `[Implemented]`
`src/pages/DailySchedule.jsx:429-436`, `src/components/TaskEditDialog.jsx:100-111`

**Retention.** Rows persist until deleted. `[Implemented]` `src/pages/Tasks.jsx:361`

**Declared-but-unwritten fields.** `status: in_progress` is never written by code. `[Implemented]`
`base44/entities/Task.jsonc:11-19` (no writer in `src/` or `base44/functions/`)

**Written-but-undeclared fields.** `frequency` is written on create by spreading the form
(`one-time` · `daily` · `weekly` · `biweekly` · `monthly` · `days_of_week` · `occurrences`). `[Implemented]`
`src/pages/Tasks.jsx:53,210-218,467-473`. The trash restore re-sends `created_by`, `created_date`, `updated_date`
from the snapshot. `[Implemented]` `src/pages/Settings.jsx:200-204`

**Required-but-written-empty.** None observed.

---

### TrashBin   (E-TrashBin)

**Purpose.** A snapshot of a deleted task so it can be restored. `[Implemented]` `base44/entities/TrashBin.jsonc:1-45`

**Source file.** `base44/entities/TrashBin.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/TrashBin.jsonc:31-44`

**Service-role bypasses.** None. `TrashBin` is absent from both wipe functions' entity lists. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:50-60`, `base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** Many per owner; one row per single-task deletion. `[Implemented]` `src/pages/Tasks.jsx:353-358`

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `item_type` | string | yes | — | `task` (only value) | Kind of snapshot | `Tasks.jsx:354` | `Settings.jsx:201` |
| `item_id` | string | yes | — | former `Task.id` | Original id | `Tasks.jsx:355` | none observed |
| `item_data` | string | yes | — | JSON of the whole task row (see `json-string-fields.md`) | Restore payload | `Tasks.jsx:356` | `Settings.jsx:200-204` |
| `deleted_at` | string | no | — | ISO date-time | Deletion moment | `Tasks.jsx:357` | `Settings.jsx:181-188` |

**References out.** `item_id` → the deleted `Task.id` (the row no longer exists after deletion). `[Implemented]`
`src/pages/Tasks.jsx:355,361`

**Referenced by.** None.

**Lifecycle.**
- *Created* immediately before a single task delete from the Tasks page. `[Implemented]` `src/pages/Tasks.jsx:351-361`
- *Restored*: a new `Task` is created from `item_data` without `id`, then the trash row is deleted.
  `[Implemented]` `src/pages/Settings.jsx:197-214`
- *Hard-deleted* by "permanently delete". `[Implemented]` `src/pages/Settings.jsx:216-226`
- *Purged*: none. Rows older than 24 hours are filtered out at read time but not deleted. `[Implemented]`
  `src/pages/Settings.jsx:181-189`

**Ordering & read-time sort/limit.** `filter({}, "-deleted_at", 50)`, then only rows whose `deleted_at` is
within the last 24 hours are shown. `[Implemented]` `src/pages/Settings.jsx:181-188`

**Denormalised caches.** `item_data` is a full copy of the task at deletion time. `[Implemented]` `src/pages/Tasks.jsx:356`

**Retention.** Indefinite in storage; 24-hour visibility window. `[Implemented]` `src/pages/Settings.jsx:183-188`

**Declared-but-unwritten fields.** None. **Written-but-undeclared fields.** None.
**Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-002** Three completion paths write different fields: Tasks page writes `status` + `last_completed_date`
  and sets `completed` on linked schedule items (`src/pages/Tasks.jsx:246-256`); the to-do writes
  `status` + `last_completed_date` and sets `completed` + `hidden_from_grid` on the schedule item
  (`src/components/DailyToDo.jsx:117-136`); the dashboard widget writes `status` only
  (`src/components/dashboard/DashboardTasks.jsx:75-80`).
- **D-005** On single delete the Tasks page reads linked schedule items and shows "Task deleted. It was also
  removed from the Daily Schedule." without issuing a `ScheduleItem` delete (`src/pages/Tasks.jsx:359-364`);
  the Daily Schedule's orphan clean-up subscribes to Chore, Goal, EducationPlan, EducationActivity, and
  GoalTask delete events, while Task events use the immediate handler without clean-up
  (`src/pages/DailySchedule.jsx:164-191`).
- **D-009** Google import label: the scheduled import writes `category: 'Google Tasks'` and no colour
  (`base44/functions/autoSync/entry.ts:135`); the manual import writes `ThemeSettings.task_sync_category`
  / `task_sync_color` with the same fallback label (`base44/functions/syncGoogleTasks/entry.ts:22-24,64-65`).
- **Q-003** Blocks: field table "Default" semantics. Several writers send `null` for declared fields
  (`due_date`, `recurrence_pattern`, `occurrences`, `completed_count`, `schedule_time`); whether the platform
  stores `null`, drops the key, or applies the schema default is not visible in the repository.
