# Daily Schedule — Daily To-Do

**Feature code:** `TODO` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Sources:** `src/components/DailyToDo.jsx`, `src/components/SwipeableToDoItem.jsx`, `src/components/CondensedChecklist.jsx` (§9), `src/components/PrintFormatDailySchedule.jsx` (to-do section).
**Referenced:** `src/components/TaskEditDialog.jsx` → `20-features/tasks`; `src/components/EventEditDialog.jsx` → `20-features/calendar`; `base44/functions/deleteToDoItem/entry.ts` → `10-architecture/google-sync.md` (Q-403); checklist rules → `20-features/daily-checklist`.

The glossary term is **daily to-do**; the card title reads "TO DO". The card is embedded in the Daily Schedule page's middle column and receives the selected date. `[Implemented]` `src/pages/DailySchedule.jsx:805`, `src/components/DailyToDo.jsx:13,247-249`

## 1. Composition

- **BR-TODO-01** The list for the date is: every `ScheduleItem` of that date that is not `hidden_from_todo` and not `deleted_from_app`, plus one synthetic **due-task row** for every `Task` whose `due_date` equals the date and which has no task-sourced or custom-sourced schedule item that day; minus any row whose id or `source_id` was deleted locally during this visit (§6). `[Implemented]` `src/components/DailyToDo.jsx:36-70`
- The task pool is the 200 newest tasks; the schedule-item query has no limit. `[Implemented]` `src/components/DailyToDo.jsx:36-37`
- **BR-TODO-02** Due-task row shape: `id` = `due-task-<taskId>`, `title`, `source_type` "task", `source_id` = task id, `date`, `start_time` = `Task.due_time` or null, `end_time` null, `priority`, `completed` = (`status` is "completed"), `notes` = `Task.description`. No status filter applies, so completed tasks due that day produce completed rows. `[Implemented]` `src/components/DailyToDo.jsx:53-67`
- Task-sourced and custom-sourced real rows are enriched with the backing task's `priority`. `[Implemented]` `src/components/DailyToDo.jsx:40-50`
- **BR-TODO-03** Sort: by `start_time` ascending; a missing time sorts as "99:99" (last). `[Implemented]` `src/components/DailyToDo.jsx:71-75`
- **BR-TODO-04** Hidden rows are the date's schedule items with `hidden_from_todo` true. `[Implemented]` `src/components/DailyToDo.jsx:76`
- The full composed list (including completed rows) is handed to the parent for the page's print/email (`spec.md` §12). `[Implemented]` `src/components/DailyToDo.jsx:13,78`
- Loads are throttled: a non-forced load within 800 ms of the previous one is skipped; date changes and Unhide force a load. `[Implemented]` `src/components/DailyToDo.jsx:31-35,81-85,215-218`
- Realtime: `ScheduleItem`, `Task`, and `GoalTask` changes reload after a 300 ms debounce, except while the component's own write is in flight. `[Implemented]` `src/components/DailyToDo.jsx:87-105`

## 2. Row presentation (meaning-bearing only)

- Each row shows a checkbox (not for goal-sourced rows), the title, and the raw `start_time` (`HH:MM`) beneath when present. `[Implemented]` `src/components/SwipeableToDoItem.jsx:87-97`
- **BR-TODO-05a** Left border colour by priority for task and custom rows: urgent red-600, high orange-500, medium cyan-500, low green-600 (spec D-408). Background tint by source: calendar and event blue; goal grey. Completed rows at half opacity with strike-through. A swiped-open row shows a red tint. `[Implemented]` `src/components/SwipeableToDoItem.jsx:8-19,72-80`
- The row has no source-type label; source is conveyed by tint only. `[Implemented]` `src/components/SwipeableToDoItem.jsx:72-97`

## 3. Header controls

`[Implemented]` `src/components/DailyToDo.jsx:250-272`

| Control | Tooltip | Behaviour |
|---|---|---|
| CheckCheck icon | "Show completed" / "Hide completed" | toggles showing completed rows; persisted as `todo_showCompleted` ("true"/"false"); default off; icon in primary colour while on `src/components/DailyToDo.jsx:17,252-260,281` |
| Eye / EyeOff icon (only when hidden rows exist) | "Show n hidden item(s)" / "Hide hidden items" | toggles the "Hidden from To Do" section `src/components/DailyToDo.jsx:16,261-265` |
| Printer | "Print" | §8 |
| Mail | "Email" | §8 |

- Empty states: "Loading..." before the first load; "No items to complete" when the list is empty (the show-completed filter does not trigger this text; a list of only completed rows with the toggle off renders no rows and no text). `[Implemented]` `src/components/DailyToDo.jsx:276-281`

## 4. Completion

- **BR-TODO-05** Checking or unchecking a row (the new value is the inverse of the row's `completed`) writes through by source type, then to the schedule item:
  - `task` with `source_id`: `Task.status` "completed" or "pending"; `Task.last_completed_date` = the selected date when completing, null when reopening. `src/components/DailyToDo.jsx:117-122`
  - `chore` with `source_id`: `Chore.status` "completed" or "pending" (Q-402). `src/components/DailyToDo.jsx:123-124`
  - `education` with `source_id`: `EducationActivity.completed`. `src/components/DailyToDo.jsx:125-126`
  - `goal`: returns before any write; goal rows also have no checkbox. `src/components/DailyToDo.jsx:108`, `src/components/SwipeableToDoItem.jsx:88-90`
  - `custom`, `calendar`, `event`: no source write.
  - Then, for a real schedule item (id not starting with `due-task-`): `ScheduleItem.completed` = new value and `ScheduleItem.hidden_from_grid` = new value. Checking a row therefore removes its block from the grid and adds it to the grid's hidden panel; unchecking restores it. `src/components/DailyToDo.jsx:130-136`
  `[Implemented]`
- The row updates optimistically; on a failed write the row reverts. A reload follows either way. `[Implemented]` `src/components/DailyToDo.jsx:111-112,137-143`
- The walkthrough states the intent: "Completing a task here also marks it complete in Tasks — and vice versa." `[Described]` `src/components/onboarding/DailyScheduleOnboarding.jsx:24`

## 5. Remove dialog

Reveal: swipe left, or hover with a mouse, shows a destructive X button on rows that are not completed; pressing it opens the dialog. `[Implemented]` `src/components/SwipeableToDoItem.jsx:99-105`

Dialog: title `Remove "<title>"`; description "What would you like to do with this item?"; a "Cancel" ghost button last. Every action button is disabled while one is running; the dialog closes when the action resolves. `[Implemented]` `src/components/SwipeableToDoItem.jsx:51-61,108-113,202-204`

**Which actions are offered** `[Implemented]` `src/components/SwipeableToDoItem.jsx:63-68,115-201`

| Condition | Label | Sub-label | Action key |
|---|---|---|---|
| source `calendar` or `event` | "Keep in Calendar" | "Remove from To Do, keep visible on Calendar page" | `keep_in_calendar` |
| any other source | "Send to Item Library" | "Keep it available to reschedule later" | `library` |
| source in task, chore, education, goal **and** has `source_id` | "Delete from App" | "Permanently remove from this app" | `delete_app` |
| (task with `source_id`) **or** (calendar/event with `google_event_id`) | "Delete from Google" | "Permanently remove from Google Tasks / Calendar" | `delete_google` |
| neither of the two rows above applies (e.g. custom, or calendar/event without a Google id) | "Delete Permanently" | "Remove this item entirely" | `delete_app` |
| the row is a real schedule item (id not `due-task-…`) | "Hide from Schedule Grid" | "Keep in To Do list, but remove from the time grid" | hide |

**What each action does** `[Implemented]` `src/components/DailyToDo.jsx:146-213,287-291`

- **BR-TODO-06** Before any write, the row's id and `source_id` are added to the local deleted set and the row leaves the list (§6). `src/components/DailyToDo.jsx:148-150`
- **BR-TODO-07** `library` (Send to Item Library): for a task-sourced row with `source_id`, update the `Task` with `due_date` null, `due_time` null, `schedule_time` null, `synced_to_schedule` false; for a real row, delete the `ScheduleItem`; for a custom-sourced row, push `{title, duration}` to recent history (`item-library.md` §3). `src/components/DailyToDo.jsx:156-179`
- **BR-TODO-08** Recent-history duration on Send to Library = end minutes − start minutes when both exist, else 60. `src/components/DailyToDo.jsx:173-176`
- **BR-TODO-09** `keep_in_calendar`: for a real row, set `hidden_from_todo` true (the row moves to the hidden section, §7; it stays on the grid and the Calendar page). Nothing for a due-task row. `src/components/DailyToDo.jsx:180-183`
- **BR-TODO-10** `delete_app` (Delete from App / Delete Permanently): for a real row, delete the `ScheduleItem`; then delete the source when `source_id` is set and the type is task (`Task`), chore (`Chore`), education (`EducationActivity`), or goal (`GoalTask`). For a custom-sourced row only the schedule item is deleted; its backing task remains. `src/components/DailyToDo.jsx:184-193`
- **BR-TODO-11** `delete_google`: for a real row, delete the `ScheduleItem`; then invoke the backend function `deleteToDoItem` with `scheduleItemId`, `action`, `sourceType`, `sourceId`, `googleEventId`, `googleCalendarId`. Observed backend outcome for this action: a task with `google_task_id` is deleted in Google Tasks and then the `Task` is deleted; a calendar/event row with `googleEventId` is deleted in the Google calendar (`googleCalendarId` or "primary"); a task without `google_task_id` is left in place (spec D-412). Google mechanics are owned by `10-architecture/google-sync.md`. `src/components/DailyToDo.jsx:194-206`, `base44/functions/deleteToDoItem/entry.ts:36,108-123`
- **BR-TODO-12** Hide from Schedule Grid: set `hidden_from_grid` true on the real row and reload; the row stays in the to-do. Not offered for due-task rows. `src/components/DailyToDo.jsx:287-291`, `src/components/SwipeableToDoItem.jsx:188-201`
- A failed action is logged and the row stays removed locally until the next reload that no longer returns it. `[Implemented]` `src/components/DailyToDo.jsx:208-212`

**Per source type, what the user can do** (derived from the two tables above):

| Source | Offered |
|---|---|
| task, real row | Send to Item Library · Delete from App · Delete from Google · Hide from Schedule Grid |
| task, due-task row | Send to Item Library · Delete from App · Delete from Google |
| chore / education / goal | Send to Item Library · Delete from App · Hide from Schedule Grid |
| custom | Send to Item Library · Delete Permanently · Hide from Schedule Grid |
| calendar / event with `google_event_id` | Keep in Calendar · Delete from Google · Hide from Schedule Grid |
| calendar / event without `google_event_id` | Keep in Calendar · Delete Permanently · Hide from Schedule Grid |

## 6. Local deleted-id memory versus realtime refresh

- **BR-TODO-13** Ids and source ids removed in this visit are kept in a component-lifetime set; every subsequent load filters rows whose id or `source_id` is in it, so a subscription reload cannot bring a removed row back. The set is never cleared while the page stays mounted; changing date does not clear it. `[Implemented]` `src/components/DailyToDo.jsx:28,69-70,148-149`
- Subscription reloads are also ignored while a completion or removal write is in flight (and for 500 ms after a removal). `[Implemented]` `src/components/DailyToDo.jsx:26,89-90,114,141,151,211`

## 7. Hidden section and Unhide

- When the Eye toggle is on and hidden rows exist, a section headed "Hidden from To Do" lists each hidden schedule item (title, start time) at reduced opacity with an "Unhide" button. `[Implemented]` `src/components/DailyToDo.jsx:305-320`
- **BR-TODO-14** Unhide sets `hidden_from_todo` false and forces a reload. `[Implemented]` `src/components/DailyToDo.jsx:215-218`

## 8. Print and email of the to-do

- "Print" renders the to-do section only (mode `todo`) with the current list (including completed rows, regardless of the show-completed toggle) into a new window titled "To Do" and opens the print dialog. `[Implemented]` `src/components/DailyToDo.jsx:220-233`
- "Email" renders the same and sends it to the signed-in user's address with subject "Daily To Do", then alerts "Sent to your email!". `[Implemented]` `src/components/DailyToDo.jsx:235-244`
- Format content: `spec.md` §12. No options dialog; nothing remembered.

## 9. Editing from a row

- **BR-TODO-15** Double-tap (two touches within 350 ms) or double-click opens edit: a task-sourced row with `source_id` fetches the `Task` and opens `TaskEditDialog`; every other row (calendar, event, chore, education, goal, custom) opens `EventEditDialog` with the row itself. `[Implemented]` `src/components/SwipeableToDoItem.jsx:43-48,85`, `src/components/DailyToDo.jsx:292-300`
- Both dialogs are bound with a hide handler here, so each shows a "Hide from Schedule" button: from the event dialog it sets `hidden_from_grid` on the row; from the task dialog it finds the first schedule item of the date with `source_id` = task id and hides that. Saving in either dialog reloads the list. `[Implemented]` `src/components/DailyToDo.jsx:323-347`, `src/components/EventEditDialog.jsx:105-109`, `src/components/TaskEditDialog.jsx:319-323`
- Editing a due-task row goes to `TaskEditDialog` (it is task-sourced with a `source_id`). `[Implemented]` `src/components/DailyToDo.jsx:293-296`

## 10. Swipe and pointer thresholds as bound here

- Touch: horizontal travel over 50 px with vertical travel under 50 px is a swipe; leftward reveals the remove button, rightward hides it when revealed. A touch that is not a swipe counts as a tap; two taps within 350 ms open edit. `[Implemented]` `src/components/SwipeableToDoItem.jsx:30-49`
- Mouse: hover reveals the remove button; double-click opens edit. `[Implemented]` `src/components/SwipeableToDoItem.jsx:83-85,99`
- Page-level swipe navigation (`10-architecture/shared-interactions.md`) is suppressed while the remove dialog is open. `[Implemented]` `src/components/Layout.jsx:80-81`

## 11. Embedded Daily Checklist (`CondensedChecklist`)

Checklist item and completion rules are owned by `20-features/daily-checklist`; this section records only the condensed rendering on the schedule page. `[Implemented]` `src/components/CondensedChecklist.jsx:1-132`

- Data: active checklist items (`is_active` true) and completions for the selected date; a completion counts when its `completed` flag is true. `src/components/CondensedChecklist.jsx:20-26`
- **BR-TODO-16** Sort: time-of-day bucket order morning 0, afternoon 1, evening 2, anytime 3 (unknown → 3); then `time_of_day` ascending with missing times as "99:99" (last); then `order`. `src/components/CondensedChecklist.jsx:28-39`
- **BR-TODO-17** Grouping under headers "Morning", "Afternoon", "Evening", "Anytime" in that order; an item with no bucket falls under Anytime; empty buckets are omitted. `src/components/CondensedChecklist.jsx:70-80,101-105`
- Row: checkbox, title (struck through when complete), and the label in upper case as a pill when present. `src/components/CondensedChecklist.jsx:107-122`
- **BR-TODO-18** Toggling creates a `ChecklistCompletion` (`checklist_item_id`, `date`, `completed` true, `completed_at` now) when none exists for the item and date, otherwise flips `completed` and sets or clears `completed_at`. `src/components/CondensedChecklist.jsx:49-65`
- **BR-TODO-19** Progress bar = completed ÷ all active items, computed before the hide-completed filter. `src/components/CondensedChecklist.jsx:67-68,94-99`
- **BR-TODO-20** Hide-completed: state read from `checklist_hide_completed` (JSON boolean, default false); exposed to the parent as `hideCompleted` and `setHideCompleted`, the latter also writing the key. The parent's eye button (`spec.md` §4) calls it and writes the same key itself. `src/components/CondensedChecklist.jsx:11-13,73,82-88`, `src/pages/DailySchedule.jsx:810-823`
- With no active items the component renders nothing. `src/components/CondensedChecklist.jsx:90`
- The list scrolls within a 16 rem maximum height. `src/components/CondensedChecklist.jsx:100`
- No realtime subscription; the list reloads when the date changes or an item is toggled. `src/components/CondensedChecklist.jsx:16-18,64`

## 12. Acceptance criteria

- **AC-TODO-03** Given a real chore-sourced row, When it is checked, Then `Chore.status` is "completed" and the schedule item is `completed` and `hidden_from_grid`; When it is unchecked, Then both revert. (refs BR-TODO-05)
- **AC-TODO-04** Given a goal-sourced row, Then it shows no checkbox. (refs BR-TODO-05)
- **AC-TODO-05** Given a custom row at 13:00–14:30, When "Send to Item Library" is chosen, Then the schedule item is deleted and recent history starts with `{title, duration: 90}`. (refs BR-TODO-07, BR-TODO-08)
- **AC-TODO-06** Given a task-sourced real row, When "Send to Item Library" is chosen, Then the task's `due_date`, `due_time`, `schedule_time` are null and `synced_to_schedule` is false, and the task reappears on the library's Tasks tab. (refs BR-TODO-07, `item-library.md` BR-SCHED-64)
- **AC-TODO-07** Given a calendar row with a `google_event_id`, When the remove dialog opens, Then it offers Keep in Calendar, Delete from Google, Hide from Schedule Grid and Cancel, and not Send to Item Library. (refs §5)
- **AC-TODO-08** Given a calendar row, When "Keep in Calendar" is chosen, Then the row moves to "Hidden from To Do", still shows on the grid, and "Unhide" returns it. (refs BR-TODO-09, BR-TODO-14)
- **AC-TODO-09** Given a custom row, When the dialog opens, Then the destructive option reads "Delete Permanently"; When chosen, Then the schedule item is deleted and its backing task remains. (refs BR-TODO-10)
- **AC-TODO-10** Given a due-task row, When the dialog opens, Then "Hide from Schedule Grid" is absent. (refs BR-TODO-12)
- **AC-TODO-11** Given a row was removed and a `ScheduleItem` subscription event fires, Then the removed row does not reappear. (refs BR-TODO-13)
- **AC-TODO-12** Given rows at 09:00, no time, and 08:00, Then the order is 08:00, 09:00, untimed. (refs BR-TODO-03)
- **AC-TODO-13** Given a task-sourced row is double-clicked, Then the task edit dialog opens with a "Hide from Schedule" button; Given a chore row, Then the event edit dialog opens. (refs BR-TODO-15)
- **AC-TODO-14** Given the to-do "Print" button, Then the new window contains only the "To Do" section. (refs §8)
- **AC-TODO-15** Given checklist items in evening 07:00, morning (no time), morning 06:30, Then the condensed list shows Morning: 06:30 then untimed, then Evening: 07:00. (refs BR-TODO-16, BR-TODO-17)
- **AC-TODO-16** Given three active checklist items with one complete and hide-completed on, Then two rows show and the progress bar is one third. (refs BR-TODO-19, BR-TODO-20)
