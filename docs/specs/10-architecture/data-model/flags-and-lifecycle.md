# Data Model — Flags, Ordering, Retention, Read Limits

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

## 1. Visibility, dismissal, and soft-delete flags

`AR-DATA-13`: dismissal is expressed by boolean flags on the row; deletion removes the row. No entity has a
generic `deleted` flag.

| Entity.field | Default | Set true by | Set false by | Effect on reads | Tag |
|---|---|---|---|---|---|
| `ScheduleItem.deleted_from_app` | `false` | Calendar page delete of a `calendar` row `src/pages/CalendarPage.jsx:179-180` | none | excluded from Calendar page (`filter` on `false`), to-do, Daily Schedule grid and carry-over, dashboard schedule `src/pages/CalendarPage.jsx:78-79`, `src/components/DailyToDo.jsx:69`, `src/pages/DailySchedule.jsx:208,297,325`, `src/components/dashboard/DashboardSchedule.jsx:49,68` | `[Implemented]` |
| `ScheduleItem.hidden_from_grid` | `false` | to-do completion, to-do "hide", event/task dialogs' hide, Daily Schedule "remove" `src/components/DailyToDo.jsx:134,289,329,343`, `src/pages/DailySchedule.jsx:363` | Daily Schedule "restore hidden" `src/pages/DailySchedule.jsx:391` | excluded from grid and carry-over; listed under hidden items `src/pages/DailySchedule.jsx:297,323,360` | `[Implemented]` |
| `ScheduleItem.hidden_from_todo` | `false` | to-do "keep in calendar" `src/components/DailyToDo.jsx:182`, `base44/functions/deleteToDoItem/entry.ts:44` | to-do "Unhide", Calendar page "re-add" `src/components/DailyToDo.jsx:216`, `src/pages/CalendarPage.jsx:92` | excluded from the to-do list; shown in "Hidden from To Do" `src/components/DailyToDo.jsx:69,76,305-319` | `[Implemented]` |
| `ScheduleItem.completed` | `false` | to-do tick, task toggle `src/components/DailyToDo.jsx:133`, `src/pages/Tasks.jsx:255` | same, inverse | hidden from the to-do unless "show completed" (device key `todo_showCompleted`) `src/components/DailyToDo.jsx:17,281` | `[Implemented]` |
| `Goal.archived` | `false` | archive action; derived completion `src/pages/Goals.jsx:225,173` | restore `src/pages/Goals.jsx:230` | Active tab = not archived and not completed; Archive tab = archived or completed; dashboard filters `archived: false`; schedule library and evaluation skip archived `src/pages/Goals.jsx:219-222`, `src/components/dashboard/DashboardGoals.jsx:75`, `src/pages/DailySchedule.jsx:1045`, `src/components/visionboard/DailyEvaluation.jsx:50` | `[Implemented]` |
| `DailyChecklist.is_active` | `true` | create `src/pages/DailyChecklist.jsx:120` | none | all readers filter `is_active: true` | `[Implemented]` (false never written) |
| `HealthPillar.is_hidden` | `false` | hide toggle `src/components/visionboard/PillarManager.jsx:158` | same toggle | excluded from the daily evaluation `src/pages/VisionBoard.jsx:263` | `[Implemented]` |
| `CollageImage.hidden_from_slideshow` | `false` | gallery toggle `src/components/visionboard/ImageGallery.jsx:46` | same toggle | excluded from slideshows and the custom picker `src/components/dashboard/DashboardSlideshow.jsx:17`, `src/pages/VisionBoard.jsx:138` | `[Implemented]` |
| `CollageImage.is_default` | `false` | user add (`true`), "save as defaults", admin function `src/components/visionboard/ImageUploadSection.jsx:25,48`, `src/pages/VisionBoard.jsx:193`, `base44/functions/makeImagesDefaults/entry.ts:31` | "save as defaults" first pass, copies `src/pages/VisionBoard.jsx:185`, `base44/functions/initializeDefaultCollageImages/entry.ts:31` | selects the seed set for new accounts / backfill; theme-library removal deletes matching `true` rows | `[Implemented]` (see D-014) |
| `UserCollageImage.include_in_slideshow` | `true` | create, toggle `src/components/visionboard/PrivateImageUploader.jsx:108,124` | toggle | dashboard slideshow filters `true`; other readers filter `!== false` `src/components/dashboard/DashboardSlideshow.jsx:23,30` | `[Implemented]` |
| `SelectedCalendars.is_selected` | `true` (schema) / `cal.primary` (writer) | Settings toggle `src/pages/Settings.jsx:544` | Settings toggle; HTTP 404 during import `base44/functions/autoSync/entry.ts:49`, `base44/functions/syncGoogleCalendarToApp/entry.ts:75` | imports iterate `is_selected: true` only | `[Implemented]` |
| `SelectedTaskLists.is_selected` | `true` | create, Settings toggle `base44/functions/getGoogleTaskLists/entry.ts:38`, `src/pages/Settings.jsx:553` | Settings toggle | display only; imports iterate every Google list `base44/functions/autoSync/entry.ts:126`, `base44/functions/syncGoogleTasks/entry.ts:39` | `[Implemented]` |
| `Affirmation.is_favorite`, `DailyQuote.is_favorite` | `false` | toggles `src/components/visionboard/AffirmationManager.jsx:96`, `src/pages/Quotes.jsx:142`, `src/components/dashboard/DashboardQuote.jsx:64` | toggles | favourites sort first; "delete all past quotes" can keep favourites `src/components/visionboard/AffirmationManager.jsx:105`, `src/pages/Quotes.jsx:176` | `[Implemented]` |
| `Task.synced_to_schedule` | `false` | calendar push `base44/functions/syncTasksToCalendar/entry.ts:83` | to-do "library", backend "library" `src/components/DailyToDo.jsx:163`, `base44/functions/deleteToDoItem/entry.ts:63` | none observed | `[Implemented]` |
| `EducationPlan.synced_to_schedule` | `false` | none | none | none | `[Implemented]` (never written) |
| `DeletedSyncItem.status` | `pending_review` | `allowed` / `denied` by the review UI `src/components/DeletedItemReview.jsx:25,45` | — | only `pending_review` rows are listed | `[Implemented]` (rows never created, see Q-005) |
| `TrashBin` (row existence) | — | single task delete `src/pages/Tasks.jsx:353` | restore / permanent delete `src/pages/Settings.jsx:207,219` | listed only if `deleted_at` within 24 h | `[Implemented]` |

## 2. Status fields

| Entity.field | Values written | Transitions | Tag |
|---|---|---|---|
| `Task.status` | `pending`, `completed` (`in_progress` declared, unwritten) | toggle both ways; occurrence tasks complete when `completed_count >= occurrences`; Google import maps `completed`/else `pending` `src/pages/Tasks.jsx:226-250`, `base44/functions/syncGoogleTasks/entry.ts:61` | `[Implemented]` |
| `Chore.status` | `pending`, `completed` (`skipped` declared, unwritten) | complete → next `due_date`; un-complete; midnight reset to `pending` while the Chores page is open `src/pages/Chores.jsx:156-180,324-338` | `[Implemented]` |
| `Goal.status` | `not_started`, `in_progress`, `completed` (`on_hold` declared, unwritten) | derived from milestone completion percentage; dashboard tick → `completed`; restore → `in_progress` `src/pages/Goals.jsx:171-176,230`, `src/components/dashboard/DashboardGoals.jsx:112` | `[Implemented]` |
| `EducationPlan.status` | none written | — | `[Implemented]` (declared only) |
| `EducationActivity.completed` | boolean | repeating activities: `true` + next `due_date`; `once`: toggle `src/pages/Education.jsx:290-303` | `[Implemented]` |
| `GoalTask.completed` | boolean | toggle, or derived from `completed_count` `src/pages/Goals.jsx:122-134` | `[Implemented]` |
| `DeletedSyncItem.status` | `allowed`, `denied` | from `pending_review` only | `[Implemented]` |

## 3. Ordering fields and how they are maintained

| Entity.field | Maintained by | Read-time use | Tag |
|---|---|---|---|
| `DailyChecklist.order` | rewritten for every row in every bucket after a drag (index within bucket); form creates with `0` `src/pages/DailyChecklist.jsx:297-308,120` | page sorts by `order`; condensed view sorts bucket → `time_of_day` → `order` `src/pages/DailyChecklist.jsx:112`, `src/components/CondensedChecklist.jsx:28-39` | `[Implemented]` (see D-012) |
| `HealthPillar.order` | seed index 0–12 `src/pages/VisionBoard.jsx:82-85` | page sorts by `order` `src/pages/VisionBoard.jsx:93` | `[Implemented]` |
| `PillarActivity.order` | seed index; count of existing activities at add time `src/components/visionboard/PillarManager.jsx:65,84,117`, `src/components/visionboard/PillarGoalGenerator.jsx:85,92` | no sort observed | `[Implemented]` |
| `CollageImage.order` | copied from the seed row (`img.order` / `img.order \|\| 0`); never set by the frontend `base44/functions/initializeDefaultCollageImages/entry.ts:30`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:38` | `list("order")` ascending; functions read `-order` | `[Implemented]` |
| `UserCollageImage.order` | never written | `list("order")` ascending | `[Implemented]` |
| `ThemeSettings.widget_order` | JSON array on drag / save `src/pages/Dashboard.jsx:145-150,166-172` | merged with defaults on load | `[Implemented]` |
| `ScheduleItem.start_time` | edits, drag, "move to now" `src/pages/DailySchedule.jsx:367-382` | to-do and grid sort by it | `[Implemented]` |
| Labels (`category`/`label`) | free text; recent list on device (max 30) `src/utils/labelHistory.js:7-12` | case-insensitive grouping, first-seen casing kept `src/lib/categoryUtils.js:2-25` | `[Implemented]` |

## 4. Retention and purge rules

| Data | Rule | Tag |
|---|---|---|
| `TrashBin` | rows shown only while `deleted_at` is within 24 h; nothing deletes older rows `src/pages/Settings.jsx:181-189` | `[Implemented]` |
| `DailyQuote` | no-repeat window = 200 newest rows; duplicates for a date deleted on fetch; forced refresh deletes the date's rows; user may delete one or all past quotes (optionally keeping favourites) `base44/functions/fetchDailyQuote/entry.ts:16-33`, `src/pages/Quotes.jsx:170-180` | `[Implemented]` |
| `ChecklistCompletion`, `DailyPillarTracking`, `DailyGratitude` | one row per date; kept indefinitely; evaluation delete removes one date `src/components/visionboard/DailyEvaluation.jsx:192-208` | `[Implemented]` |
| Recurring `Task` duplicates | pending recurring tasks sharing `title` + `recurrence_pattern` reduced to one (earliest `due_date`) on Tasks page mount `src/pages/Tasks.jsx:93-121` | `[Implemented]` |
| Imported `ScheduleItem` rows | deleted when the Google event is gone, only inside −90/+60 days and only for calendars fetched successfully in that run; duplicates by `google_event_id` (or `title\|date\|start_time`) reduced to the newest by the repair function `base44/functions/syncGoogleCalendarToApp/entry.ts:160-182`, `base44/functions/deduplicateCalendarEvents/entry.ts:16-35` | `[Implemented]` |
| `UserCollageImage.signed_url` | re-minted when expiring within 60 s of now; 3600 s lifetime `src/components/visionboard/PrivateImageUploader.jsx:6-20` | `[Implemented]` |
| Weather cache | not an entity; device-local (`lastLocation`) and in-memory only; owner `20-features/weather` | `[Implemented]` `src/components/WeatherWidget.jsx` (key listed in `json-string-fields.md` §13) |
| Label history | device-local, 30 entries, most recent first; cleared or pruned per label `src/utils/labelHistory.js:7-21` | `[Implemented]` |
| Custom block history | device-local, 10 entries `src/components/DailyToDo.jsx:177`, `src/pages/DailySchedule.jsx:403` | `[Implemented]` |
| Background library | 20 URLs, most recent first `src/pages/ThemeEditor.jsx:131,160` | `[Implemented]` |
| Everything else | indefinite until user delete, synced-data wipe, full wipe, or account deletion `base44/functions/deleteSyncedData/entry.ts:49-83`, `base44/functions/deleteUserAccount/entry.ts:31-81` | `[Implemented]` |

## 5. Read limits and sort orders observed at call sites

`AR-DATA-12`. Sort `-x` is descending. "—" means unsorted or unlimited as written.

| Entity | Query | Sort | Limit | Call site |
|---|---|---|---|---|
| Task | `{}` | `-created_date` | 100 | `src/pages/Tasks.jsx:141` |
| Task | `{}` | `-created_date` | 200 | `src/pages/Tasks.jsx:94`, `src/components/DailyToDo.jsx:37` |
| Task | `{ status: "pending" }` | `-created_date` | 200 / 500 | `src/components/dashboard/DashboardTasks.jsx:52,128` |
| Task | `{}` | `-updated_date` | 100 | `src/pages/DailySchedule.jsx:235` |
| Task | `{ status: { $ne: 'completed' } }` | `-created_date` | 100 | `base44/functions/syncTasksToCalendar/entry.ts:29-31` |
| Task | `{ google_task_id }` (+ `created_by`) | — | 1 | `base44/functions/autoSync/entry.ts:134`, `base44/functions/syncGoogleTasks/entry.ts:53-56` |
| Task | `{ google_task_id: { $exists: true } }` | `-created_date` | 50 per page, ≤ 200 pages | `base44/functions/deleteSyncedData/entry.ts:25` |
| Task | `{ title, is_recurring, recurrence_pattern, status }` | — | — | `src/pages/Tasks.jsx:260-265` |
| TrashBin | `{}` | `-deleted_at` | 50 | `src/pages/Settings.jsx:181` |
| ScheduleItem | `{ date }` | — / `-updated_date` | — / 200 / 100 | `src/components/DailyToDo.jsx:36`, `src/pages/DailySchedule.jsx:205,238,242`, `src/components/dashboard/DashboardSchedule.jsx:48` |
| ScheduleItem | `{ source_type: "calendar", deleted_from_app: false }` | `-date` | 1000 | `src/pages/CalendarPage.jsx:78` |
| ScheduleItem | `{ source_type: "event", deleted_from_app: false }` | `-date` | 500 | `src/pages/CalendarPage.jsx:79` |
| ScheduleItem | `{}` | `-date` | 1000 | `src/components/dashboard/DashboardSchedule.jsx:64` |
| ScheduleItem | `{ source_type: 'calendar' }` | — / `-created_date` | 1000 / 3000 / 500×20 | `base44/functions/autoSync/entry.ts:67`, `base44/functions/syncGoogleCalendarToApp/entry.ts:29`, `base44/functions/deduplicateCalendarEvents/entry.ts:7-11` |
| ScheduleItem | `{}` | `-created_date` | 3000 | `base44/functions/syncGoogleCalendarToApp/entry.ts:30` |
| ScheduleItem | `{ source_id }` / `{ date, source_id }` | — | — | `src/pages/Tasks.jsx:253,360`, `src/components/TaskEditDialog.jsx:102`, `src/pages/DailySchedule.jsx:177`, `src/components/DailyToDo.jsx:341` |
| Chore | `list` | `-created_date` | 1000 / 500 | `src/pages/Chores.jsx:190`, `src/components/ChoreLibraryDialog.jsx:54`, `src/components/dashboard/DashboardMenuChores.jsx:57` |
| Chore | `{ status: "pending" }` | `-created_date` | 300 | `src/pages/Dashboard.jsx:80` |
| Chore | `{}` | `-updated_date` | 100 | `src/pages/DailySchedule.jsx:236` |
| ChoreLibrary | `list` | `-created_date` / `-updated_date` / — | 1000 / 200 / 100 / — / 500 | `src/pages/Chores.jsx:192,245,428`, `src/components/ChoreLibraryDialog.jsx:53`, `src/components/ChoreGenerator.jsx:127`, `base44/functions/clearChoreLibraryAssignments/entry.ts:17` |
| ChoreUser | `list` | — / `name` | — / 50 | `src/pages/Chores.jsx:191`, `src/pages/Goals.jsx:235` |
| Goal | `list` | `-created_date` | 200 | `src/pages/Goals.jsx:84`, `src/components/visionboard/DailyEvaluation.jsx:40` |
| Goal | `{ archived: false }` | `-created_date` | 100 | `src/components/dashboard/DashboardGoals.jsx:75` |
| Goal | `{}` | `-updated_date` | 100 | `src/pages/DailySchedule.jsx:237` |
| GoalTask | `list` | `-created_date` | 500 | `src/pages/Goals.jsx:102`, `src/components/visionboard/DailyEvaluation.jsx:41` |
| GoalTask | `{}` | `created_date` | 500 | `src/pages/DailySchedule.jsx:239` |
| GoalTask | `{ goal_id }` | — | — | `src/pages/Goals.jsx:168` |
| DailyChecklist | `{ is_active: true }` | — | — | four readers, see `checklist.md` |
| ChecklistCompletion | `{ date }` | — | — | five readers, see `checklist.md` |
| DailyGratitude | `{ date }` | — | — | `src/components/visionboard/DailyEvaluation.jsx:79`, `src/components/dashboard/DashboardFocalAreas.jsx:33` |
| Learner | `list` / `{}` | — / `-updated_date` | — / 50 | `src/pages/Education.jsx:141`, `src/pages/DailySchedule.jsx:240` |
| EducationPlan | `list` | `-created_date` | 200 | `src/pages/Education.jsx:142` |
| EducationActivity | `list` | `-created_date` / `-updated_date` | 500 | `src/pages/Education.jsx:143`, `src/components/ActivityLibrary.jsx:34`, `src/pages/DailySchedule.jsx:285` |
| EducationActivity | `{ due_date }` | `-updated_date` | 100 | `src/pages/DailySchedule.jsx:241` |
| EducationActivity | `{ completed: false }` | — | 200 | `src/pages/Dashboard.jsx:81` |
| EducationActivity | `list` | — | — | `src/components/ActivityGenerator.jsx:137` |
| FavoriteActivity | `list` | `-updated_date` | 100 | `src/components/ActivityLibrary.jsx:49` |
| HealthPillar | `list` | — | — | `src/pages/VisionBoard.jsx:78`, `src/components/dashboard/DashboardFocalAreas.jsx:30`, `src/components/dashboard/DashboardSlideshow.jsx:59` |
| PillarActivity | `list` | — | — | four readers, see `vision-board.md` |
| DailyPillarTracking | `list` | `-date` | 200 / 50 | `src/pages/VisionBoard.jsx:110,263`, `src/components/dashboard/DashboardFocalAreas.jsx:31`, `src/components/dashboard/DashboardSlideshow.jsx:58` |
| DailyPillarTracking | `{ date }` / `{ pillar_id, date }` / `{ pillar_id }` / `{}` | — / `-date` | — / 1 / — | `src/pages/Dashboard.jsx:112`, `src/components/visionboard/DailyEvaluation.jsx:65,125,196`, `src/components/visionboard/PillarGoalGenerator.jsx:23`, `src/components/visionboard/WeeklyReview.jsx:50` |
| Affirmation | `list` | — / `-updated_date` | — / 50 | `src/components/dashboard/DashboardSlideshow.jsx:51`, `src/pages/VisionBoard.jsx:148`, `src/components/visionboard/AffirmationManager.jsx:45` |
| CollageImage | `list` | — / `order` / `-updated_date` / `-order` | — / 1000 / 100 / 1 / 100 / 1000 / 10000 | `src/components/dashboard/DashboardSlideshow.jsx:16`, `src/components/visionboard/ImageGallery.jsx:23`, `src/pages/VisionBoard.jsx:135,180`, `base44/functions/initializeDefaultCollageImages/entry.ts:13,20`, `base44/functions/makeImagesDefaults/entry.ts:17`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13` |
| CollageImage | `{ image_url, is_default: true }` / `{ created_by }` | — | 100 / 1000 | `src/pages/ThemeEditor.jsx:150`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:29` |
| UserCollageImage | `list` / `{ include_in_slideshow: true }` | `order` | 500 | `src/components/visionboard/PrivateImageUploader.jsx:38`, `src/pages/VisionBoard.jsx:117`, `src/components/dashboard/DashboardSlideshow.jsx:30` |
| DailyQuote | `list` | `-created_date` / `-date` | 200 / 50 | `base44/functions/fetchDailyQuote/entry.ts:16`, `src/pages/Quotes.jsx:79,95` |
| DailyQuote | `{ date, created_by }` / `{ created_by }` / `{ date }` | `-created_date` / — | 1 / 200 / — | `base44/functions/generateDailyQuotes/entry.ts:30,37`, `src/components/dashboard/DashboardQuote.jsx:36` |
| Link | `list` | `-created_date` | — | `src/pages/Links.jsx:119` |
| SelectedCalendars | `{ is_selected: true }` / `{ created_by }` / `{}` | — | — | `base44/functions/autoSync/entry.ts:26`, `base44/functions/syncGoogleCalendarToApp/entry.ts:22`, `base44/functions/getGoogleCalendars/entry.ts:26`, `src/pages/Settings.jsx:298` |
| SelectedTaskLists | `list` / `{}` | — | — | `base44/functions/getGoogleTaskLists/entry.ts:29,48`, `src/pages/Settings.jsx:318` |
| SyncState | `list` | `-updated_date` / — | 1 / — | `base44/functions/autoSync/entry.ts:97`, `base44/functions/syncGoogleCalendarToApp/entry.ts:186`, `src/pages/Settings.jsx:361`, `base44/functions/syncTasksToCalendar/entry.ts:93` |
| DeletedSyncItem | `{ status: 'pending_review' }` | `-last_detected` | 100 | `src/components/DeletedItemReview.jsx:18` |
| ThemeSettings | `list` | `-updated_date` | 1 | sixteen readers, see `settings.md` |
| ReminderSettings | `list` | — | — | `src/components/dashboard/DashboardFocalAreas.jsx:32` |
| User | `list` | — / `-created_date` | — / 10000 | `base44/functions/generateDailyQuotes/entry.ts:23`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:21` |
| any (wipe) | `list` | `-created_date` | 50 per page, ≤ 200 pages | `base44/functions/deleteSyncedData/entry.ts:6-20` |

## 6. Subscriptions

Live reload subscriptions exist on Task, ScheduleItem, GoalTask, Chore, Goal, EducationPlan,
EducationActivity. `[Implemented]` `src/components/DailyToDo.jsx:96-100`, `src/pages/DailySchedule.jsx:183-191`,
`src/pages/Tasks.jsx:128`, `src/pages/CalendarPage.jsx:68`, `src/components/dashboard/DashboardGoals.jsx:84`,
`src/components/dashboard/DashboardMenuChores.jsx:75`

## 7. Discrepancies & open questions (all DATA sheets)

- **D-001** `Chore.assigned_to` id vs name (`chores.md`).
- **D-002** Task completion writes differ across three paths (`tasks.md`).
- **D-003** Chore completion writes differ between page/dashboard and to-do (`chores.md`).
- **D-004** Goal completion: dashboard tick vs derived update on `archived` (`goals.md`).
- **D-005** Task delete and linked schedule rows (`tasks.md`, `schedule.md`).
- **D-006** `ScheduleItem.source_type` declared vs written values (`schedule.md`).
- **D-007** `Goal.timeframe` UI value `occurrences` absent from the enum (`goals.md`).
- **D-008** Scheduled vs manual calendar import and Google ids (`schedule.md`, `sync.md`).
- **D-009** Imported task label: hardcoded vs setting (`tasks.md`).
- **D-010** `SyncState` scope in the calendar push vs imports (`sync.md`).
- **D-011** `Chore.day_of_week` full vs short day names (`chores.md`).
- **D-012** Checklist sort orders (`checklist.md`).
- **D-013** `Goal.member_name` defaults (`goals.md`).
- **D-014** `CollageImage.is_default` "Legacy field" vs seed marker (`vision-board.md`).
- **D-015** `HealthPillar.name` enum vs free-text rename (`vision-board.md`).
- **Q-001** Enum enforcement at write time (`schedule.md`, `goals.md`, `vision-board.md`).
- **Q-002** Blocks: every "Default" column. Whether the platform applies schema defaults when a create omits the
  field (e.g. `ScheduleItem.completed`, `Chore.status` on rows created without `status`) is not visible.
- **Q-003** `null` writes semantics (`tasks.md`).
- **Q-004** Seed-set owner for `CollageImage` (`vision-board.md`).
- **Q-005** `DeletedSyncItem` producer (`sync.md`).
- **Q-006** `ReminderSettings` producer (`settings.md`).
- **Q-007** Subscription event shape (`schedule.md`, `relationships.md`).
- **Q-008** Undeclared `User` fields (`settings.md`).
