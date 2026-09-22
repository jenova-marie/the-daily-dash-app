# Data Model — Schedule

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### ScheduleItem   (E-ScheduleItem)

**Purpose.** One time-boxed block on one date. It is the hub where Google Calendar events, Calendar-page
events, tasks placed on the Daily Schedule, custom blocks, and scheduled milestone tasks all live, each
tagged with a source type and the id of the row it came from. `[Implemented]`
`base44/entities/ScheduleItem.jsonc:1-88`, `src/pages/DailySchedule.jsx:319-336`

**Source file.** `base44/entities/ScheduleItem.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ScheduleItem.jsonc:74-87`

**Service-role bypasses.** `deleteToDoItem` reads by id, updates `hidden_from_todo`, and deletes through
`asServiceRole` after checking `created_by`. `deleteUserAccount` deletes through `asServiceRole` filtered on
`created_by`. `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:42-44,58-66,74-94`,
`base44/functions/deleteUserAccount/entry.ts:34-36`

**Entity workflows.** Three platform workflows fire on this entity: create where `source_type == "custom"`
→ push create; update where `source_type == "custom"` and `google_event_id != null` → push update; delete
where the old row had `source_type == "custom"` and `google_event_id != null` → push delete. `[Implemented]`
`base44/workflows/Sync App Events to Google Calendar (Create).jsonc:5-12`,
`base44/workflows/Sync App Events to Google Calendar (Update).jsonc:5-12`,
`base44/workflows/Sync App Events to Google Calendar (Delete).jsonc:5-12`

**Cardinality.** Many per owner and per date. Google import keeps one row per Google event by matching
`source_id` or `google_event_id`; a repair function keeps the most recently updated row per
`google_event_id` (or per `title|date|start_time` for rows without one). `[Implemented]`
`base44/functions/syncGoogleCalendarToApp/entry.ts:33-49,124-140`, `base44/functions/deduplicateCalendarEvents/entry.ts:16-30`

**Writers (entity-wide).** create: `src/pages/DailySchedule.jsx:429`, `src/pages/CalendarPage.jsx:144`,
`src/components/DeletedItemReview.jsx:35`, `base44/functions/autoSync/entry.ts:91`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:145` (bulkCreate).
update: `src/components/DailyToDo.jsx:132,182,216,289,329,343`, `src/pages/DailySchedule.jsx:363,379,391`,
`src/components/EventEditDialog.jsx:33`, `src/components/SwipeableEventItem.jsx:76`,
`src/components/TaskEditDialog.jsx:108`, `src/pages/Tasks.jsx:255`, `src/pages/CalendarPage.jsx:92,180`,
`base44/functions/deleteToDoItem/entry.ts:44`, `base44/functions/syncAppEventToGoogle/entry.ts:58`,
`base44/functions/autoSync/entry.ts:88`, `base44/functions/syncGoogleCalendarToApp/entry.ts:152`.
delete: `src/components/DailyToDo.jsx:168,186,197`, `src/pages/DailySchedule.jsx:178`, `src/pages/CalendarPage.jsx:182`,
`base44/functions/deleteToDoItem/entry.ts:66,94`, `base44/functions/syncGoogleCalendarToApp/entry.ts:180`,
`base44/functions/deduplicateCalendarEvents/entry.ts:34`, `base44/functions/deleteSyncedData/entry.ts:61-62,69`,
`base44/functions/deleteUserAccount/entry.ts:34-36`.

**Readers (entity-wide).** `src/components/DailyToDo.jsx:36,341`, `src/pages/DailySchedule.jsx:177,205,238,242`,
`src/pages/CalendarPage.jsx:78-79`, `src/components/dashboard/DashboardSchedule.jsx:48,64`,
`src/components/TaskEditDialog.jsx:102`, `src/pages/Tasks.jsx:253,360`,
`base44/functions/autoSync/entry.ts:67`, `base44/functions/syncGoogleCalendarToApp/entry.ts:28-31`,
`base44/functions/deduplicateCalendarEvents/entry.ts:7-11`, `base44/functions/deleteToDoItem/entry.ts:13`.
subscribe: `src/components/DailyToDo.jsx:97`, `src/pages/DailySchedule.jsx:184`, `src/pages/CalendarPage.jsx:68`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text | Block title | all creators; `SwipeableEventItem.jsx:77`; sync (`event.summary`) | all readers; dedup key `deduplicateCalendarEvents:20`; identical-check `syncGoogleCalendarToApp:128` |
| `date` | string | yes | — | `YYYY-MM-DD` | The day | all creators; `EventEditDialog.jsx:34`, `SwipeableEventItem.jsx:78`, `TaskEditDialog.jsx:105`; sync | date filters everywhere; deletion window `syncGoogleCalendarToApp:171-174` |
| `start_time` | string | yes | — | `HH:MM`; all-day Google events → `00:00` | Start | all creators; `DailySchedule.jsx:379`, `EventEditDialog.jsx:35`, `SwipeableEventItem.jsx:79`, `TaskEditDialog.jsx:106`; sync (`autoSync:78-84`) | sorting `DailyToDo.jsx:71-75`, grid placement `DailySchedule.jsx:447-452`, carry-over `DailySchedule.jsx:295-317` |
| `end_time` | string | no | — | `HH:MM`; all-day Google events → `23:59`; push defaults missing value to `23:59` | End | as `start_time`; `syncAppEventToGoogle:29,71` reads with default | grid, carry-over, push |
| `source_type` | string | no | — | declared: `calendar` · `task` · `education` · `chore` · `custom`; written: `calendar`, `task`, `custom`, `event`, `goal` | Origin of the block | `DailySchedule.jsx:434` (`custom` / `task` / `goal` per library type, `DailySchedule.jsx:937-966,1021,1097-1099`), `CalendarPage.jsx:149` (`event`), `DeletedItemReview.jsx:40` (`calendar`), sync (`calendar`) | `DailyToDo.jsx:46,108,117-128,171,189-192`, `DailySchedule.jsx:324-331,974,1044`, `CalendarPage.jsx:78-79,179`, `DashboardSchedule.jsx:49,67`, workflows, `deleteToDoItem:52-85,102-112` |
| `source_id` | string | no | — | id of Task (`task`, `custom`), GoalTask or Goal (`goal`), or the Google event id (`calendar`) | Origin row | `DailySchedule.jsx:417-435`, `DeletedItemReview.jsx:41`, `autoSync:86`, `syncGoogleCalendarToApp:117` | `DailyToDo.jsx:46-48,117-128`, `DailySchedule.jsx:177,330,974,1044`, `TaskEditDialog.jsx:102`, `Tasks.jsx:253,360`, dedup maps `syncGoogleCalendarToApp:37-49`, `autoSync:70-71` |
| `color` | string | no | — | hex; `#3b82f6` for imported rows | Display colour | `autoSync:86`, `syncGoogleCalendarToApp:121`, `DeletedItemReview.jsx:42` | rendering |
| `notes` | string | no | — | free text; HTML stripped on manual import | Description | `CalendarPage.jsx:150`, `SwipeableEventItem.jsx:81`, `autoSync:86` (raw), `syncGoogleCalendarToApp:109,120` (stripped) | `DailyToDo.jsx:66` (task rows only), push `syncAppEventToGoogle:33,75` |
| `completed` | boolean | no | `false` | — | Ticked on the to-do | `DailyToDo.jsx:133`, `Tasks.jsx:255` | `DailyToDo.jsx:281` |
| `priority` | string | no | — | `low` · `medium` · `high` · `urgent` | Declared; never written. In-memory copies take the linked task's priority | none | `DailySchedule.jsx:73,330-333`, `DailyToDo.jsx:45-50` (read from Task, not from this field) |
| `deleted_from_app` | boolean | no | `false` | — | "Removed from app" for calendar-sourced rows; the Google event survives | `CalendarPage.jsx:180` | `CalendarPage.jsx:78-79`, `DailyToDo.jsx:69`, `DailySchedule.jsx:208,297,325`, `DashboardSchedule.jsx:49,68` |
| `hidden_from_grid` | boolean | no | `false` | — | Dismissed from the Daily Schedule grid | `DailySchedule.jsx:363` (`true`), `:391` (`false`), `DailyToDo.jsx:134,289,329,343` (`true`) | `DailySchedule.jsx:297,323,360` |
| `hidden_from_todo` | boolean | no | `false` | — | Dismissed from the daily to-do ("keep in calendar") | `DailyToDo.jsx:182` (`true`), `:216` (`false`), `CalendarPage.jsx:92` (`false`), `deleteToDoItem:44` (`true`) | `DailyToDo.jsx:69,76` |
| `google_event_id` | string | no | — | Google Calendar event id | Link to Google | `syncGoogleCalendarToApp:118`, `syncAppEventToGoogle:59` (after push create) | workflows, `EventEditDialog.jsx:20,40`, `SwipeableEventItem.jsx:84`, `CalendarPage.jsx:172`, `DailyToDo.jsx:204`, dedup, deletion rule `syncGoogleCalendarToApp:165-168` |
| `google_calendar_id` | string | no | — | Google calendar id (`primary` or a calendar's id) | Which calendar | `syncGoogleCalendarToApp:119`, `syncAppEventToGoogle:60` | `syncAppEventToGoogle:24`, `deleteToDoItem:115`, deletion rule `syncGoogleCalendarToApp:166-167` |

**References out.** `source_id` → `Task.id` (`task`, `custom`), `GoalTask.id` or `Goal.id` (`goal`), Google
event id (`calendar`); `google_event_id` → Google event; `google_calendar_id` → `SelectedCalendars.calendar_id`
(the Google id, not the row id). `[Implemented]` `src/pages/DailySchedule.jsx:417-435,1097-1099`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:116-119,165-167`

**Referenced by.** `DeletedSyncItem.google_id` is written back as `source_id` when a tombstone is denied.
`[Implemented]` `src/components/DeletedItemReview.jsx:34-44`. Virtual to-do rows use the id prefix
`due-task-` and are never persisted. `[Implemented]` `src/components/DailyToDo.jsx:57,131,154`

**Lifecycle.**
- *Created* from the Daily Schedule item library: `source_type` is the library section's type (`custom`,
  `task`, `goal`); for `custom` a Task is created first and its id becomes `source_id`; `end_time` = start +
  chosen duration. `[Implemented]` `src/pages/DailySchedule.jsx:410-443`
- *Created* from the Calendar page with `source_type: "event"`; optionally pushed to Google straight away.
  `[Implemented]` `src/pages/CalendarPage.jsx:142-164`
- *Created / updated* by Google import: scheduled import matches on `source_id` only and writes no Google
  ids (`autoSync:67-95`); manual import matches on `source_id` or `google_event_id`, skips rows whose
  `title`/`date`/`start_time`/`end_time` are unchanged, bulk-creates in batches of 20, and updates at most 20
  per calendar per run. `[Implemented]` `base44/functions/autoSync/entry.ts:67-95`,
  `base44/functions/syncGoogleCalendarToApp/entry.ts:92-154`
- *Created* on tombstone deny at today 09:00–10:00 with `source_type: 'calendar'` and `source_id` = the
  Google id. `[Implemented]` `src/components/DeletedItemReview.jsx:30-48`
- *Updated* with Google ids after a successful push create. `[Implemented]` `base44/functions/syncAppEventToGoogle/entry.ts:55-61`
- *Updated* by drag/"move to now" (`start_time`, `end_time`), the event edit dialog (`date`, times), the
  swipe edit (`title`, `date`, times, `notes`), and task edits (`date`, `start_time`). `[Implemented]`
  `src/pages/DailySchedule.jsx:367-382`, `src/components/EventEditDialog.jsx:30-45`,
  `src/components/SwipeableEventItem.jsx:74-90`, `src/components/TaskEditDialog.jsx:100-111`
- *Completed* via the to-do (`completed`, `hidden_from_grid`) or via the task toggle (`completed` only).
  `[Implemented]` `src/components/DailyToDo.jsx:131-136`, `src/pages/Tasks.jsx:252-256`
- *Dismissed* from the grid (`hidden_from_grid`) with a "hidden items" restore list; dismissed from the to-do
  (`hidden_from_todo`) with an "Unhide" list and a Calendar-page "re-add" action. `[Implemented]`
  `src/pages/DailySchedule.jsx:360-365,390-393`, `src/components/DailyToDo.jsx:180-183,215-218,305-319`,
  `src/pages/CalendarPage.jsx:91-94`
- *Soft-deleted* ("remove from app") when a `calendar` row is deleted on the Calendar page: `deleted_from_app`
  → `true`; any other source type on that page is hard-deleted. `[Implemented]` `src/pages/CalendarPage.jsx:170-185`
- *Hard-deleted* by to-do actions `library`, `delete_app`, `delete_google`; by manual import when the Google
  event is absent from a successfully fetched calendar and the row has both Google ids and a date inside
  −90/+60 days; by the dedup repair; by orphan clean-up after a source delete event; by the synced-data
  wipe, full wipe, and account deletion. `[Implemented]` `src/components/DailyToDo.jsx:166-198`,
  `base44/functions/deleteToDoItem/entry.ts:66,94`, `base44/functions/syncGoogleCalendarToApp/entry.ts:160-182`,
  `base44/functions/deduplicateCalendarEvents/entry.ts:25-35`, `src/pages/DailySchedule.jsx:168-182`,
  `base44/functions/deleteSyncedData/entry.ts:61-62,69`, `base44/functions/deleteUserAccount/entry.ts:34-36`
- *Purged*: none.

**Ordering & read-time sort/limit.** Per-date `filter({ date })` unsorted (to-do, dashboard) or
`-updated_date` 200 (Daily Schedule, previous day 100); `-date` 1000 for `calendar` and 500 for `event` rows
(Calendar page); `-date` 1000 unfiltered (dashboard print range); sync reads `source_type: 'calendar'`
at 1000 (scheduled), 3000 twice (manual), 500 per page up to 20 pages (dedup). In memory the to-do sorts by
`start_time` with missing times last; the grid sorts by `start_time`. `[Implemented]`
`src/components/DailyToDo.jsx:36,71-75`, `src/pages/DailySchedule.jsx:238,242,336`, `src/pages/CalendarPage.jsx:78-79`,
`src/components/dashboard/DashboardSchedule.jsx:48,64`, `base44/functions/autoSync/entry.ts:67`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:28-31`, `base44/functions/deduplicateCalendarEvents/entry.ts:6-14`

**Denormalised caches.** `title` (and for `task` rows nothing else) is copied from the source row at
creation; the Google import refreshes `title`, `date`, times, `notes` on every run; task edits refresh
`date`/`start_time` only. `[Implemented]` `src/pages/DailySchedule.jsx:430`,
`base44/functions/syncGoogleCalendarToApp/entry.ts:111-133`, `src/components/TaskEditDialog.jsx:103-109`

**Retention.** Indefinite; imported rows outside the manual window are never deleted by sync. `[Implemented]`
`base44/functions/syncGoogleCalendarToApp/entry.ts:170-176`

**Declared-but-unwritten fields.** `priority` (no writer). Enum values `education` and `chore` for
`source_type` (no writer). `[Implemented]` `base44/entities/ScheduleItem.jsonc:18-27,41-49`

**Written-but-undeclared fields.** Enum values `event` (`src/pages/CalendarPage.jsx:149`) and `goal`
(`src/pages/DailySchedule.jsx:434` with `type="goal"` at `:1097-1099`) for `source_type`. `[Implemented]`

**Required-but-written-empty.** `start_time` is required; the Calendar page writes the form's value, which
defaults to `09:00` and can be edited to empty. `[Implemented]` `src/pages/CalendarPage.jsx:147,152`

---

## Discrepancies & open questions (this sheet)

- **D-006** `source_type` declares `calendar | task | education | chore | custom`
  (`base44/entities/ScheduleItem.jsonc:18-27`); code writes `event` (`src/pages/CalendarPage.jsx:149`) and
  `goal` (`src/pages/DailySchedule.jsx:434,1097-1099`) and never writes `education` or `chore`; the to-do and
  the backend delete map `education` and `chore` to source entities (`src/components/DailyToDo.jsx:123-128,190-191`,
  `base44/functions/deleteToDoItem/entry.ts:81-82`).
- **D-008** Scheduled import writes calendar rows without `google_event_id`/`google_calendar_id`
  (`base44/functions/autoSync/entry.ts:86`); manual import writes both (`base44/functions/syncGoogleCalendarToApp/entry.ts:111-122`)
  and only deletes rows that carry both (`:163-169`).
- **D-005** (see `tasks.md`) Task deletion does not delete linked schedule rows; the orphan clean-up in the
  Daily Schedule handles delete events for other source entities only, using the first pending id
  (`src/pages/DailySchedule.jsx:168-182`).
- **Q-001** Blocks: field table enum column. Whether the platform accepts or rejects `source_type` values
  outside the declared enum (`event`, `goal`) at write time is not visible in the repository.
- **Q-007** Blocks: `relationships.md` §5 cascade table. The subscription callback is read as
  `event.type === 'delete'` with `event.id` (`src/pages/DailySchedule.jsx:169`); the platform's event shape
  is not documented in the repository.
