# Daily Schedule — Item Library

**Feature code:** `SCHED` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Source:** `src/pages/DailySchedule.jsx` (library card, tabs and quick links: lines 831-1118; add and pin logic: 395-443, 496-532; the row component `LibraryItem`: 1165-1277; device-local state: 113-118).

The glossary term is **item library**; the card title reads "Item Library". Rows are "library entries" below.

## 1. Card and Quick Task

- The card title "Item Library" is itself a button that collapses or expands the whole panel (chevron down when open, right when collapsed); collapsed is memory-only and defaults to open. `[Implemented]` `src/pages/DailySchedule.jsx:101,832-836,891`
- The header holds one "+" button (tooltip "Quick Task"). It toggles a popover containing a text input with placeholder "Task title..." (auto-focused, cleared on open) and a small "+" button. `[Implemented]` `src/pages/DailySchedule.jsx:839-889`
- **BR-SCHED-60** Quick Task creation: Enter in the input, or the "+" button, with a non-blank trimmed title creates a `Task` with `title` (trimmed), `status` "pending", `category` "Quick Task"; then pushes `{title, duration: 60}` onto recent history (§3), clears the input and closes the popover. Escape closes without creating. A blank title does nothing. `[Implemented]` `src/pages/DailySchedule.jsx:853-868,871-884`
- The new task then appears on the Tasks tab (it has no due date) after the `Task` subscription reload. `[Implemented]` `src/pages/DailySchedule.jsx:184,975-979`

## 2. Tabs

Three tabs, default "Recent": "Recent" (Clock icon), "Tasks" (ListTodo icon), "Goals" (Sparkles icon). Each tab body scrolls within a 24 rem maximum height. `[Implemented]` `src/pages/DailySchedule.jsx:892-899,972,1040`

### 2a. Recent tab

Order of content, top to bottom `[Implemented]` `src/pages/DailySchedule.jsx:898-969`:

1. **Quick links** row: the "Chores (n)" and "Edu (n)" buttons (`spec.md` §4 and BR-SCHED-09 to BR-SCHED-14), each only while its feature toggle is on. `[Implemented]` `src/pages/DailySchedule.jsx:900-934`
2. **Pinned synthetic entries**: "Chores" (id `default-chores`) and "Edu" (id `default-edu`), each only while pinned and while its toggle is on. `[Implemented]` `src/pages/DailySchedule.jsx:937-938`
3. **Pinned recent-history entries**, in history order. `[Implemented]` `src/pages/DailySchedule.jsx:941-951`
4. **Unpinned synthetic entries** "Chores" and "Edu" (toggle-gated). `[Implemented]` `src/pages/DailySchedule.jsx:954-955`
5. **Unpinned recent-history entries**, in history order. `[Implemented]` `src/pages/DailySchedule.jsx:958-968`

- **BR-SCHED-61** The two synthetic entries are of type `custom` with titles "Chores" and "Edu"; adding one creates a backing `Task` and a custom block exactly as any custom entry (§5). `[Implemented]` `src/pages/DailySchedule.jsx:937-938,954-955,419-427`
- **BR-SCHED-62** Recent-history entries are of type `custom`. Their pin identity is `custom-<index>` where index is the entry's position in the history list, so pin state is positional. `[Implemented]` `src/pages/DailySchedule.jsx:942,948,959,965`
- **BR-SCHED-63** "Remove from recent" (X button) removes every history entry with the same title and rewrites the device-local list. Synthetic entries have no remove button. `[Implemented]` `src/pages/DailySchedule.jsx:943-947,960-964,1203-1211`
- Pinning (§4) is offered on the Recent tab only; Tasks and Goals rows receive no pin handler. `[Implemented]` `src/pages/DailySchedule.jsx:1018-1026,1097,1099`
- The stored `duration` of a history entry is not read when adding; the mini form's own duration applies. `[Implemented]` `src/pages/DailySchedule.jsx:1181-1184,1269`

### 2b. Tasks tab

- **BR-SCHED-64** Inclusion: a task is available when no task-sourced schedule item of the selected date has it as `source_id`, its `status` is not "completed", and it has either no `due_date` or a `due_date` on or before the selected date. Tasks due in the future are excluded. `[Implemented]` `src/pages/DailySchedule.jsx:974-979`
- The candidate pool is the page's task query (100 most recently updated). `[Implemented]` `src/pages/DailySchedule.jsx:235`
- Empty text: "No unscheduled or overdue tasks". `[Implemented]` `src/pages/DailySchedule.jsx:981-983`
- **BR-SCHED-65** Grouping: by the task's label (`Task.category`), with the literal "(No Label)" for tasks without one; groups sorted alphabetically with "(No Label)" last. Group headers show the label in upper case. `[Implemented]` `src/pages/DailySchedule.jsx:985-997,1013`
- **BR-SCHED-66** Group urgency badge: shown when the group has any overdue or due-today task; its number is overdue count + due-today-not-overdue count; red-600 when any task is overdue, else blue-600. `[Implemented]` `src/pages/DailySchedule.jsx:998-1012`
- Groups start collapsed; clicking the header toggles that group (key `task-<label>`), remembered in memory for the visit. `[Implemented]` `src/pages/DailySchedule.jsx:94,492-494,1004-1015`
- Each row receives the page's due-today, overdue, and due-or-overdue flags (`spec.md` §5b). `[Implemented]` `src/pages/DailySchedule.jsx:1017-1026`

### 2c. Goals tab

- When the account has no goals at all (the 100-row query is empty), the tab reads "No active goals". `[Implemented]` `src/pages/DailySchedule.jsx:1041-1042`
- **BR-SCHED-67** Candidate goals: not `archived` and `status` not "completed". `[Implemented]` `src/pages/DailySchedule.jsx:1045`
- **BR-SCHED-68** For each candidate goal: its milestone tasks that are not `completed`, sorted oldest `created_date` first; of those, the ones with no goal-sourced schedule item on the selected date are "unscheduled". The goal is listed when it has at least one unscheduled milestone task, or when it has no incomplete milestone tasks at all. Only the first unscheduled milestone task is offered (next-action behaviour). `[Implemented]` `src/pages/DailySchedule.jsx:1044,1050-1056`
- **BR-SCHED-69** A goal with no incomplete milestone tasks is offered as a row itself; adding it creates a schedule item of source type `goal` whose `source_id` is the goal's id (Q-404). `[Implemented]` `src/pages/DailySchedule.jsx:1054-1056,1096-1099`
- When candidates exist but none qualifies: "No available goals". `[Implemented]` `src/pages/DailySchedule.jsx:1059-1061`
- **BR-SCHED-70** Grouping: by `Goal.category` with the literal "(No Category)" fallback, sorted alphabetically with "(No Category)" last; each category header is coloured with the first goal's `category_color` (muted when none) and shows "(n)" goals. Inside a category each goal is a collapsible row (key `goal-<id>`); inside it the single milestone-task row or the goal row. All levels start collapsed. `[Implemented]` `src/pages/DailySchedule.jsx:1063-1107`
- Due flags on goal rows: due today when `Goal.target_date` equals the selected date; overdue when it precedes it. `[Implemented]` `src/pages/DailySchedule.jsx:1097,1099`

## 3. Recent history (device-local)

- **BR-SCHED-71** Shape: a JSON array under `schedule_custom_history` of `{title, duration}` objects, newest first, at most 10 entries; adding an entry first removes any entry with the same title. `[Implemented]` `src/pages/DailySchedule.jsx:113-115,402-405,860-863,878-881`
- Writers: Quick Task create (duration 60); "Send to Item Library" on a custom-sourced to-do row (duration = end − start in minutes, or 60 when either time is missing) (`daily-todo.md` BR-TODO-08); the unreachable `addCustomItem` (duration 60). `[Implemented]` `src/pages/DailySchedule.jsx:860-863,402-405`, `src/components/DailyToDo.jsx:170-179`
- Adding a custom entry to the grid does not itself write history. `[Implemented]` `src/pages/DailySchedule.jsx:410-443`

## 4. Pinning

- The pin button (tooltip "Pin to top" / "Unpin"; filled when pinned) toggles the entry's id in a set persisted as a JSON array under `pinned_library_items`. `[Implemented]` `src/pages/DailySchedule.jsx:116-118,523-532,1194-1202`
- Pinned entries move above unpinned ones within the Recent tab (§2a). Pinning never changes the stored history. `[Implemented]` `src/pages/DailySchedule.jsx:936-968`

## 5. Library row and the add-to-grid mini form

Each row shows the title and an action cluster. `[Implemented]` `src/pages/DailySchedule.jsx:1188-1233`

- **BR-SCHED-72** The action cluster is always visible when the row is overdue, due today, due-or-overdue, or pinned; otherwise it appears on hover. `[Implemented]` `src/pages/DailySchedule.jsx:1193`
- **BR-SCHED-73** Add-button colour carries urgency: overdue → red-600 round "+" (tooltip "Overdue - Add to schedule"); due today or due-or-overdue → blue-600 round "+" (tooltip "Due today - Add to schedule"); otherwise a small ghost arrow. All three open the mini form. `[Implemented]` `src/pages/DailySchedule.jsx:1212-1232`
- Manual and walkthrough state the same colour meaning: "Items due today appear in blue; overdue in red." `[Described]` `src/pages/UserManual.jsx:168`, `src/components/onboarding/DailyScheduleOnboarding.jsx:14`

**Mini form** (replaces the action cluster in place) `[Implemented]` `src/pages/DailySchedule.jsx:1166-1172,1234-1273`:

| Field | Control | Default | Notes |
|---|---|---|---|
| "Time:" hour | text, max 2 chars | "9" | parsed as integer, 0 when not a number |
| minute | text, max 2 chars | "00" | left-padded to 2 |
| AM/PM | select "AM" / "PM" | "AM" | PM adds 12 except for 12; 12 AM becomes 0 |
| "Dur:" value | text | "1" | parsed as decimal, 0 when not a number |
| unit | select "min" / "hr" | "hr" | hr → `round(value × 60)`; min → `round(value)` |
| "Pri:" | select Low / Medium / High / Urgent | Medium | shown for `custom` rows only |
| "Add" | button | | calls add, then hides the form |

- **BR-SCHED-74** Time conversion: `HH:MM` 24-hour from hour, minute and AM/PM as above. `[Implemented]` `src/pages/DailySchedule.jsx:1174-1179`
- **BR-SCHED-75** Duration conversion: minutes as above; no minimum is enforced at the form. `[Implemented]` `src/pages/DailySchedule.jsx:1181-1184`
- Form state is per row and persists in memory while the row stays mounted. `[Implemented]` `src/pages/DailySchedule.jsx:1166-1172`

## 6. What adding creates

`addFromLibrary(item, type, time, durationMins, priority)` `[Implemented]` `src/pages/DailySchedule.jsx:410-443`:

- **BR-SCHED-76** `end_time` = start plus duration, with the hour taken modulo 24 (so a block that passes midnight ends at an earlier clock time and renders as spanning, `time-grid.md` §5). `[Implemented]` `src/pages/DailySchedule.jsx:411-415`
- **BR-SCHED-77** For type `custom` (synthetic entries and recent history): first create a `Task` with `title`, `status` "pending", `priority` (from the form; "medium" when absent), `category` "Custom"; its id becomes the `source_id`. `[Implemented]` `src/pages/DailySchedule.jsx:417-427`
- **BR-SCHED-78** Then create the `ScheduleItem` with `title` = the entry's title, `date` = selected date, `start_time`, `end_time`, `source_type` = the row's type (`task`, `goal`, or `custom`), `source_id` = the task id, milestone-task id, goal id, or new custom task id. No `priority`, `notes`, or `color` is written on the item. `[Implemented]` `src/pages/DailySchedule.jsx:429-436`
- **BR-SCHED-79** For type `task`, the `Task` is then updated with `due_date` = selected date and `schedule_time` = the start time. `[Implemented]` `src/pages/DailySchedule.jsx:438-441`
- For type `goal` nothing is written on the `GoalTask` or `Goal`. `[Implemented]` `src/pages/DailySchedule.jsx:410-443`
- The page reloads; the added task or milestone task leaves its tab because it is now scheduled for the date (BR-SCHED-64, BR-SCHED-68). `[Implemented]` `src/pages/DailySchedule.jsx:442`

Summary per row type:

| Row type | Backing write | ScheduleItem `source_type` / `source_id` | Post-write |
|---|---|---|---|
| task | none before | `task` / task id | `Task.due_date`, `Task.schedule_time` |
| goal (milestone task) | none | `goal` / milestone task id | none |
| goal (goal itself) | none | `goal` / goal id | none |
| custom (synthetic or history) | new `Task` (category "Custom", priority from form) | `custom` / new task id | none |

## 7. Acceptance criteria

- **AC-SCHED-40** Given the Quick Task popover, When "Buy milk" is entered and Enter pressed, Then a `Task` "Buy milk" with category "Quick Task" exists, "Buy milk" is the first recent-history entry, and the popover closes. (refs BR-SCHED-60, BR-SCHED-71)
- **AC-SCHED-41** Given a task due tomorrow and a task with no due date, When the Tasks tab renders today, Then only the undated task is listed. (refs BR-SCHED-64)
- **AC-SCHED-42** Given a label group with one overdue and one due-today task, Then its header badge reads "2" in red. (refs BR-SCHED-66)
- **AC-SCHED-43** Given a goal with three incomplete milestone tasks none scheduled today, When its row is expanded, Then exactly the oldest milestone task is offered. (refs BR-SCHED-68)
- **AC-SCHED-44** Given a recent-history entry, When "9", "30", "PM", "45", "min", "High" are entered and Add pressed, Then a `Task` (category "Custom", priority high) and a `ScheduleItem` (custom, 21:30–22:15) exist for the selected date. (refs BR-SCHED-74 to BR-SCHED-78)
- **AC-SCHED-45** Given a task row, When it is added at 09:00 for 1 hr, Then a task-sourced `ScheduleItem` 09:00–10:00 exists and the `Task` has `due_date` = selected date and `schedule_time` "09:00". (refs BR-SCHED-79)
- **AC-SCHED-46** Given "Edu" is pinned and `enable_education` is later set false, When the Recent tab renders, Then neither the Edu quick link nor the "Edu" entry appears. (refs §2a, `spec.md` §0)
- **AC-SCHED-47** Given two recent entries with the same title cannot exist, When a Quick Task repeats an existing title, Then the older entry is removed and the title sits first. (refs BR-SCHED-71)
- **AC-SCHED-48** Given eleven distinct Quick Tasks are created, Then recent history holds the ten newest. (refs BR-SCHED-71)
