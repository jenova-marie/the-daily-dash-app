# Tasks — Feature Spec

**Feature code:** `TASK` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 163 · Described 18 · Partial 4

**Sources owned:** `src/pages/Tasks.jsx`, `src/components/TaskEditDialog.jsx`, `src/components/CategoryFilter.jsx`, `src/lib/categoryUtils.js`, `src/lib/recurringTaskUtils.js`, `src/components/PrintFormatTasks.jsx`, `src/components/PrintFormatTasksByDay.jsx`, `src/components/dashboard/DashboardTasks.jsx`, `src/components/onboarding/TasksOnboarding.jsx`
**Sources referenced (owned elsewhere):** `src/components/LabelPicker.jsx` + `src/utils/labelHistory.js`, `src/components/SwipeableListItem.jsx`, `src/components/ModernTimePicker.jsx`, `src/lib/HeaderContext.jsx`, `src/components/PrintRangeDialog.jsx` → `10-architecture/shared-interactions.md`; `src/components/WidgetCard.jsx`, `src/lib/printUtils.js` → `10-architecture/export-print-email.md`; `base44/functions/syncGoogleTasks`, `base44/functions/updateGoogleTask`, `base44/functions/getGoogleTaskLists`, `base44/functions/autoSync` → `10-architecture/google-sync.md`; `src/pages/DailySchedule.jsx`, `src/components/DailyToDo.jsx` (ScheduleItem cascade model) → `10-architecture/schedule-hub.md`; due/overdue canon → `10-architecture/time-and-date-semantics.md`; `src/pages/Settings.jsx` (Trash Bin card, Task Manager card, Integrations, Sync dialog) → `20-features/settings`; `src/pages/Dashboard.jsx` (widget registry, badges) → `20-features/dashboard`; `src/pages/UserManual.jsx`, `src/pages/LandingPage.jsx` → `20-features/user-manual`, `20-features/app-shell`.

**Sub-specs (Level 2):** `recurrence.md` (recurrence patterns, occurrence tasks, next-occurrence creation, deduplication, show-today rule), `google-tasks.md` (what the user sees and chooses for Google Tasks, plus trash/restore).

**Permissions:** per-user data (`Task` and `TrashBin` rows are readable, writable, and deletable only by their creator — `base44/entities/Task.jsonc:96-109`, `base44/entities/TrashBin.jsonc:31-43`); admin-only operations: none.

## 0. Entry points & navigation

- Route: `/tasks` `[Implemented]` `src/App.jsx:204` · Sidebar label: **Tasks** (icon ListTodo) `[Implemented]` `src/components/Layout.jsx:15` · Header title text: **Task Manager** `[Implemented]` `src/pages/Tasks.jsx:42` · Position in nav order: third of fourteen (after Dashboard and Daily Checklist, before Calendar) `[Implemented]` `src/components/Layout.jsx:12-27`; swipe-order mechanics are owned by `10-architecture/shared-interactions.md`.
- Query parameters accepted: none observed. `[Implemented]` `src/pages/Tasks.jsx:40-59`
- Feature-toggle gating: none; the nav item is always shown. `[Implemented]` `src/components/Layout.jsx:15`
- Header right-slot contents: one icon button titled **Guide** that reopens the walkthrough (§9). `[Implemented]` `src/pages/Tasks.jsx:43`
- Secondary entry points into task editing (not routes): the dashboard **TODAY'S TASKS** widget opens the same edit dialog on double-click (§4.9) `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:86,176-183`; the Daily Schedule's daily to-do opens it for task-sourced rows and passes a **Hide from Schedule** action (binding described in §7) `[Implemented]` `src/components/DailyToDo.jsx:292-300,333-347`.

## 1. Purpose & user benefit

The Tasks page is the account owner's single backlog of one-time and recurring to-dos. Each task carries a priority, an optional label with colour, an optional due date and time, an optional recurrence pattern, attached reference links, and a note. The page lets the user slice the backlog by what is active, due today, overdue, upcoming, unscheduled, or completed; group it by priority, recurrence, or label; print or email the current view; and see today's slice again on the dashboard.

User Manual, section "Tasks" (`src/pages/UserManual.jsx:101`) `[Described]`:

> Tasks are one-time or recurring to-dos with due dates, priorities, categories, and optional Google Tasks sync for seamless productivity.

User Manual, "Creating & Managing Tasks" (`src/pages/UserManual.jsx:106-111`) `[Described]`:

> - Click **"Add Task"** to create a new task — fill in title, description, due date, due time, priority (low / medium / high / urgent), and category label.
> - **Priority color coding:** Low (gray), Medium (blue), High (orange), Urgent (red).
> - **Task status workflow:** Pending → In Progress → Completed. Click the status circle to advance through states.
> - **Category labels:** Assign custom color-coded categories to organize tasks (e.g., Work, Personal, Shopping, etc.).
> - **Edit tasks** by clicking the task row to open the detail editor where you can modify all fields including dates, times, and links.
> - **Delete tasks** via the action menu — deleted tasks can be recovered from the Trash Bin in Settings within 30 days.

User Manual, "Recurring Tasks" (`src/pages/UserManual.jsx:117-120`) `[Described]`:

> - Toggle **"Is Recurring"** when creating a task to enable repeat patterns.
> - Set frequency to **Daily, Weekly** (choose specific days), or **Monthly**.
> - Recurring tasks **reset automatically** at the start of the next cycle after completion.
> - Edit the recurrence pattern anytime without affecting completion history.

User Manual, "Filtering & Syncing" (`src/pages/UserManual.jsx:126-130`) `[Described]`:

> - **Filter & sort** by status, priority, due date, or category using the controls at the top.
> - **Search tasks** by keyword to quickly find what you need.
> - **Google Tasks sync:** Connect Google Tasks in Settings, then use the "Sync" button to pull tasks in bidirectionally. Matched tasks update automatically.
> - Set a **default sync category** in Settings to apply automatically to newly synced Google Tasks.
> - **Add to Schedule:** Push tasks with a due date to your Daily Schedule by selecting a specific time slot from the task editor.

User Manual, "Today's Tasks Widget" (`src/pages/UserManual.jsx:47-48`) `[Described]`:

> Displays pending and in-progress tasks due today. Check tasks off directly here. Tasks are color-coded by priority.

Landing page feature card **Task Management** (`src/pages/LandingPage.jsx:8`) `[Described]`:

> Create, organize, and track recurring or one-time tasks with priorities, due dates, and category labels.

Onboarding copy is quoted in full in §9.

## 2. Concepts & vocabulary

Glossary terms used: **account owner**, **label** (the UI and the `Task.category` / `Task.category_color` fields say "category"; this spec says label), **recurrence pattern**, **occurrence**, **schedule item**, **source type**, **item library**, **daily to-do**, **trash**, **connector**, **import**, **push**, **widget**, **walkthrough**, **device-local preference**, **account preference**, **export**, **today**.

Feature-local terms, defined once:

- **Active view** — the filter value `Active`: every task whose status is not `completed`. `src/pages/Tasks.jsx:180-181`
- **Future-dated task** — a non-completed task whose `due_date` is after today. `src/pages/Tasks.jsx:639`
- **Occurrence task** — a task whose recurrence pattern is `occurrences` ("X Times Total"); it completes only after being checked `occurrences` times. `src/pages/Tasks.jsx:231-244`
- **Group** — one collapsible heading in the list (a priority, a recurrence pattern, or a label). `src/pages/Tasks.jsx:731-747`
- **Group exception** — a group the user toggled away from the page-wide collapsed/expanded state. `src/pages/Tasks.jsx:73-84`
- **Next occurrence** — the new pending task created when a recurring task is completed. `src/pages/Tasks.jsx:258-319`
- **Time-of-day bucket (tasks widget)** — Morning / Afternoon / Evening / Night / Anytime, derived from `due_time` in the dashboard widget. Distinct from the checklist's time-of-day bucket in the glossary. `src/components/dashboard/DashboardTasks.jsx:14-29`

## 3. User stories

- **US-TASK-01** As the account owner, I want to add a task with a title, note, priority, due date, due time, label, and recurrence so that everything I must do lives in one list. `[Implemented]` `src/pages/Tasks.jsx:391-510`
- **US-TASK-02** As the account owner, I want to tick a task complete (and untick it) so that my list reflects reality. `[Implemented]` `src/pages/Tasks.jsx:226-322,669-672`
- **US-TASK-03** As the account owner, I want a completed recurring task to come back for its next period so that habits and routines never fall off the list. `[Implemented]` `src/pages/Tasks.jsx:258-319`
- **US-TASK-04** As the account owner, I want to double-click or double-tap a task to edit every field, including links, so that I can correct it in place. `[Implemented]` `src/pages/Tasks.jsx:644-652,673`, `src/components/TaskEditDialog.jsx:131-331`
- **US-TASK-05** As the account owner, I want to filter the list to Active, Due Today, Overdue, Pending (upcoming), Unscheduled, or Completed so that I only see what matters now. `[Implemented]` `src/pages/Tasks.jsx:517-529,179-198`
- **US-TASK-06** As the account owner, I want to group the list by Priority, Frequency, or Label, and narrow a label view to one label, so that I can focus on one slice. `[Implemented]` `src/pages/Tasks.jsx:530-555,749-799`
- **US-TASK-07** As the account owner, I want to collapse or expand all groups and then open individual ones so that a long list stays scannable. `[Implemented]` `src/pages/Tasks.jsx:70-89,563-565,731-747`
- **US-TASK-08** As the account owner, I want to delete a task, or select several and delete them together, so that stale items leave the list. `[Implemented]` `src/pages/Tasks.jsx:331-367,372-390`
- **US-TASK-09** As the account owner, I want a deleted task to be recoverable from Settings so that a slip is not final. `[Implemented]` `src/pages/Tasks.jsx:352-358`, `src/pages/Settings.jsx:197-214`
- **US-TASK-10** As the account owner, I want to choose whether deleting a Google-synced task also deletes it in Google so that the two lists stay the way I intend. `[Partial]` `src/pages/Tasks.jsx:339-350,820-840` (see google-tasks.md)
- **US-TASK-11** As the account owner, I want to print or email the current task view so that I can carry it on paper. `[Implemented]` `src/pages/Tasks.jsx:566-586`
- **US-TASK-12** As the account owner, I want the dashboard to show today's and overdue tasks, grouped by time of day, so that I can act without opening the Tasks page. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:48-73,135-175`
- **US-TASK-13** As the account owner, I want future-dated tasks to recede visually in the Active view so that today's work stands out. `[Implemented]` `src/pages/Tasks.jsx:639,643,663`
- **US-TASK-14** As the account owner, I want a task's completion, due date, and deletion to carry through to the blocks I placed on my Daily Schedule so that the two never disagree. `[Implemented]` `src/pages/Tasks.jsx:252-256,360-364`, `src/components/TaskEditDialog.jsx:100-111`

## 4. Capabilities & interactions

### 4.1 Page header controls

- The page body starts with a control row. In normal mode it holds a **Select** button and a **+** (plus icon) button that opens the New Task dialog. `[Implemented]` `src/pages/Tasks.jsx:386-394`
- In batch mode with nothing selected the row shows only **Cancel**. `[Implemented]` `src/pages/Tasks.jsx:382-385`
- In batch mode with a selection the row shows "`N` selected", a destructive **Delete** button, and **Cancel**. `[Implemented]` `src/pages/Tasks.jsx:372-381`
- The manual calls the add control **"Add Task"**; the prototype renders an icon-only plus button with no text. `[Described]` `src/pages/UserManual.jsx:106` vs `[Implemented]` `src/pages/Tasks.jsx:393` (D-450).

### 4.2 Add a task (New Task dialog)

Dialog title **New Task**. `[Implemented]` `src/pages/Tasks.jsx:396`

| Field | Control | Default | Validation / notes | Citation |
|---|---|---|---|---|
| Title | text input, placeholder "Task title" | empty | required; **Create Task** silently does nothing while empty | `src/pages/Tasks.jsx:399-400,202` |
| Description | textarea, placeholder "Details..." | empty | optional; stored as `description` | `src/pages/Tasks.jsx:403-404` |
| Priority | select: Low / Medium / High / Urgent | Medium | values `low`, `medium`, `high`, `urgent` | `src/pages/Tasks.jsx:408-417,53` |
| Due Date | button "Pick date" opening a calendar popover; an **X** button appears beside it once a date is set and clears it | none | stored `YYYY-MM-DD`; picked date is converted through the UTC date string (see D-451) | `src/pages/Tasks.jsx:422-446,436` |
| Due Time | ModernTimePicker (owned by shared-interactions) | empty | stored as `due_time` text | `src/pages/Tasks.jsx:449-450` |
| Label + colour | LabelPicker (owned by shared-interactions); stored as `category` and `category_color` | empty / empty | on create, a non-empty label is saved to the shared label history | `src/pages/Tasks.jsx:454-460,203` |
| Frequency | select: One-time / Daily / Weekly / Biweekly (Every 2 Weeks) / Monthly / Specific Days of Week / X Times Total | One-time | changing frequency clears any chosen days | `src/pages/Tasks.jsx:463-475,464` |
| How many times? | number input, min 1; shown only for X Times Total | 1 | non-numeric input falls back to 1 | `src/pages/Tasks.jsx:477-487` |
| Days | seven checkboxes Mon Tue Wed Thu Fri Sat Sun; label reads **Select Days** for Specific Days of Week and **Days of Week (optional)** for Weekly; shown only for those two frequencies | none | stored as `days_of_week` array of three-letter names | `src/pages/Tasks.jsx:488-506` |

- Submit button **Create Task** (full width). `[Implemented]` `src/pages/Tasks.jsx:507`
- On create the record is written with: all form fields; `due_date` null when unset; `is_recurring` true unless frequency is One-time; `recurrence_pattern` equal to the frequency (null for One-time); `occurrences` set only for X Times Total (else null); `completed_count` 0 for X Times Total (else null). The transient form key `frequency` is also included in the write. `[Implemented]` `src/pages/Tasks.jsx:208-218`
- After create the form resets to defaults, the dialog closes, and the list reloads. `[Implemented]` `src/pages/Tasks.jsx:219-221`
- The manual describes an **"Is Recurring"** toggle on create; the prototype's create dialog uses the Frequency select, while the edit dialog has a **Recurring task** checkbox. `[Described]` `src/pages/UserManual.jsx:117` vs `[Implemented]` `src/pages/Tasks.jsx:463-475`, `src/components/TaskEditDialog.jsx:202-203` (D-452).

### 4.3 Complete / uncomplete a task

- Each row has a checkbox reflecting `status === "completed"`. Ticking toggles the task. `[Implemented]` `src/pages/Tasks.jsx:669-672`
- A task already mid-toggle ignores further clicks until the first finishes. `[Implemented]` `src/pages/Tasks.jsx:224-228,320`
- Non-occurrence tasks flip between `pending` and `completed`; `last_completed_date` is set to today on completion and cleared to null on uncompletion. `[Implemented]` `src/pages/Tasks.jsx:246-250`
- Every schedule item whose `source_id` is the task id has its `completed` flag set to match (cascade; model owned by `10-architecture/schedule-hub.md`). `[Implemented]` `src/pages/Tasks.jsx:252-256`
- Completing a recurring task creates its next occurrence under the rules in `recurrence.md` §3. `[Implemented]` `src/pages/Tasks.jsx:258-319`
- Occurrence tasks increment or decrement `completed_count` instead of flipping directly (rules in `recurrence.md` §2). `[Implemented]` `src/pages/Tasks.jsx:231-244`
- Completed rows show the title struck through in muted text. `[Implemented]` `src/pages/Tasks.jsx:674-676`
- Status circle progression (Pending → In Progress → Completed): the manual describes a status circle that advances through three states. The prototype's `Task.status` enum includes `in_progress`, but no control on the Tasks page, edit dialog, or dashboard widget sets it; the only status transitions are the checkbox's pending ↔ completed. `[Described]` `src/pages/UserManual.jsx:108`; enum `[Implemented]` `base44/entities/Task.jsonc:11-19`; toggle `[Implemented]` `src/pages/Tasks.jsx:246-250` (D-453).

### 4.4 Edit a task (Edit Task dialog)

Opened by double-click on the row body, or by two taps within 300 ms (see §4a). `[Implemented]` `src/pages/Tasks.jsx:644-652,673`. Dialog title **Edit Task**. `[Implemented]` `src/components/TaskEditDialog.jsx:134`

| Field | Control | Initial value | Notes | Citation |
|---|---|---|---|---|
| Task Name | text input, placeholder "Task name..." | task title | no validation; an empty name saves | `src/components/TaskEditDialog.jsx:138-139,85-86` |
| Priority | select Low / Medium / High / Urgent | task priority, else Medium | | `src/components/TaskEditDialog.jsx:142-153` |
| "Synced with Google Tasks" | static text | shown only when the task has a `google_task_id` | | `src/components/TaskEditDialog.jsx:155` |
| Category | LabelPicker | task label + colour | field label reads "Category" | `src/components/TaskEditDialog.jsx:158-165` |
| Due Date | button "Pick a date" with calendar popover and a **Clear date** button once set | task due date | picked date is stored as the local `yyyy-MM-dd` | `src/components/TaskEditDialog.jsx:169-192,181` |
| Due Time | ModernTimePicker | task due time | | `src/components/TaskEditDialog.jsx:195-196` |
| Recurring task | checkbox | task `is_recurring` | reveals the pattern controls | `src/components/TaskEditDialog.jsx:202-203` |
| Pattern | select Daily / Weekly / Biweekly / Monthly / Specific Days of Week / X Times Total | task pattern, else Weekly | shown only when Recurring is ticked | `src/components/TaskEditDialog.jsx:207-219,32` |
| Day toggles | seven toggle buttons Sun Mon Tue Wed Thu Fri Sat | task `days_of_week` | shown for Weekly and Specific Days of Week | `src/components/TaskEditDialog.jsx:220-237,20` |
| Total occurrences | number input, min 1 | task `occurrences`, else 1 | shown only for X Times Total | `src/components/TaskEditDialog.jsx:238-249` |
| Link chips | one chip per stored URL showing the hostname without a leading "www."; hover reveals a trash icon that removes the chip; clicking a chip opens the URL in a new tab | parsed from `links` JSON | rendered only when at least one link exists | `src/components/TaskEditDialog.jsx:253-284` |
| Notes | textarea, placeholder "Add notes...", 3 rows | task `description` | | `src/components/TaskEditDialog.jsx:286-293` |
| Add Link | URL input, placeholder "Paste URL...", plus a **+** button (disabled while empty); Enter adds | empty | trimmed; appended to the list | `src/components/TaskEditDialog.jsx:296-309,70-75` |
| Apply permanent changes to Google Tasks | checkbox | ticked when the task has a `google_task_id` | shown only for Google-linked tasks; see google-tasks.md | `src/components/TaskEditDialog.jsx:311-316,30` |

- Footer buttons: **Cancel**, **Hide from Schedule** (only when the host passes a hide handler; the Tasks page does not, the daily to-do does), **Save** (shows a spinner while saving). `[Implemented]` `src/components/TaskEditDialog.jsx:317-328`, `src/pages/Tasks.jsx:842-847`, `src/components/DailyToDo.jsx:333-347`
- Save writes title, priority, due_date, due_time, category, category_color, description, `links` (JSON string), `is_recurring`, `recurrence_pattern` (null when not recurring), `days_of_week` (kept only for Weekly / Specific Days of Week, otherwise emptied), and `occurrences` (from the input for X Times Total, otherwise left as the task's existing value). A non-empty label is saved to label history first. `[Implemented]` `src/components/TaskEditDialog.jsx:81-98`
- `completed_count` and `last_completed_date` are not touched by Save. `[Implemented]` `src/components/TaskEditDialog.jsx:85-98`
- If the due date or due time changed, every schedule item with `source_id` = task id is updated: `date` takes the new due date (only when a date is set and changed); `start_time` takes the new due time, or keeps the item's own start time when the due time was cleared. `[Implemented]` `src/components/TaskEditDialog.jsx:100-111`
- If the task is Google-linked and the checkbox is ticked, the `updateGoogleTask` function is invoked with the new date and time (details in google-tasks.md). `[Implemented]` `src/components/TaskEditDialog.jsx:113-120`
- On success the host's refresh callback runs and the dialog closes. `[Implemented]` `src/components/TaskEditDialog.jsx:122-123`
- Reopening the dialog for a different task or reopening it at all re-seeds every field from the task. `[Implemented]` `src/components/TaskEditDialog.jsx:45-64`
- The manual says the editor opens "by clicking the task row"; the prototype opens it on double-click or double-tap. `[Described]` `src/pages/UserManual.jsx:110` vs `[Implemented]` `src/pages/Tasks.jsx:644-652,673` (D-454).
- The manual's "Add to Schedule … by selecting a specific time slot from the task editor": no time-slot or schedule control exists in the edit dialog. Placing a task on the schedule is done from the Daily Schedule's item library (owned by `20-features/daily-schedule`; it writes `due_date` and `schedule_time` back to the task, `src/pages/DailySchedule.jsx:438-440`). `[Described]` `src/pages/UserManual.jsx:130` (D-455).

### 4.5 Task row contents

- Left border colour carries priority (see §5 BR-TASK-07). `[Implemented]` `src/pages/Tasks.jsx:31-36,663`
- Checkbox, then the row body (title; link chips; occurrence progress; date/time line), then the label in uppercase in its colour, then a note icon. `[Implemented]` `src/pages/Tasks.jsx:669-726`
- **Link chips**: the first two stored URLs are shown as chips with an external-link icon and the hostname minus a leading "www."; a third or later link is summarised as "+N". Clicking a chip opens the URL in a new tab and does not count as a tap on the row. `[Implemented]` `src/pages/Tasks.jsx:653-658,677-697`
- **Occurrence progress**: for pattern `occurrences` with more than one occurrence, the row shows "`completed_count`/`occurrences` done" and a small progress bar filled to the rounded percentage. `[Implemented]` `src/pages/Tasks.jsx:698-705`
- **Date/time line**: the due date as "MMM d"; then the due time as stored; if there is no due time but a `schedule_time` (written by the Daily Schedule when the task is placed on the grid), that is shown instead. `[Implemented]` `src/pages/Tasks.jsx:706-712`
- **Label**: shown uppercase in `category_color`; when the label has no colour the row uses a default cyan. `[Implemented]` `src/pages/Tasks.jsx:642,714-721`
- **View note**: a notebook icon titled "View note" appears when the task has a description; clicking it opens a read-only dialog titled with the task title and showing the description with line breaks preserved. `[Implemented]` `src/pages/Tasks.jsx:722-726,804-811`
- In the Active view, future-dated tasks are rendered dimmed and desaturated (BR-TASK-10). `[Implemented]` `src/pages/Tasks.jsx:639,643,663`

### 4.6 Delete a task

- Hovering (mouse) or long-pressing 500 ms (touch) a row reveals an **X** delete button; pressing it opens the shared confirm dialog "Delete Item?" / "This action cannot be undone." with **Cancel** and **Delete**. Mechanics owned by `10-architecture/shared-interactions.md`. `[Implemented]` `src/components/SwipeableListItem.jsx:14-23,46-61,109-135`, binding `src/pages/Tasks.jsx:660-662`
- After the shared confirm, a task without a `google_task_id` is deleted at once. `[Implemented]` `src/pages/Tasks.jsx:339-345`
- A task with a `google_task_id` instead opens a second dialog, verbatim: title **Delete Task**; body **This task is synced with Google Tasks. Would you like to delete it from Google Tasks as well?**; buttons **Cancel**, **Delete here only**, **Delete from Google too**. `[Implemented]` `src/pages/Tasks.jsx:820-840`
- "Delete from Google too" first invokes the `syncGoogleTasks` function with the Google task id (see google-tasks.md §4 for what that function does with it). `[Partial]` `src/pages/Tasks.jsx:347-350`, `base44/functions/syncGoogleTasks/entry.ts:1-87`
- Before the record is deleted, a trash snapshot is written: `item_type` "task", `item_id` the task id, `item_data` the JSON of the whole task, `deleted_at` now (ISO). `[Implemented]` `src/pages/Tasks.jsx:352-358`
- The page then reads the schedule items linked to the task, deletes the task, and if any linked items existed shows a dismissible bottom-right notice: **Task deleted. It was also removed from the Daily Schedule.** The linked schedule items themselves are not written to by this page. `[Implemented]` `src/pages/Tasks.jsx:360-364,813-818`
- The manual says deletion is "via the action menu"; the prototype has no menu (hover/long-press X). `[Described]` `src/pages/UserManual.jsx:111` (D-456).
- Onboarding step 4 says "Swipe left on any task to delete it"; the row component reveals delete on hover or long-press and has no swipe handling. `[Described]` `src/components/onboarding/TasksOnboarding.jsx:27` vs `[Implemented]` `src/components/SwipeableListItem.jsx:14-44` (D-457).

### 4.7 Batch select and delete

- **Select** enters batch mode; each row then shows a selection checkbox instead of the delete affordance. `[Implemented]` `src/pages/Tasks.jsx:388-390,664-667`, `src/components/SwipeableListItem.jsx:61,97-108`
- Clicking a row's selection toggle adds or removes it from the selection set. `[Implemented]` `src/pages/Tasks.jsx:324-329`
- **Delete** with a selection asks a browser `confirm` reading "Delete `N` task(s)?" and, on OK, deletes every selected task directly. No trash snapshot is written, no Google dialog is shown, and no schedule-item lookup occurs on this path. `[Implemented]` `src/pages/Tasks.jsx:331-337`
- **Cancel** leaves batch mode and clears the selection. `[Implemented]` `src/pages/Tasks.jsx:378-385`

### 4.8 Filter, sort/group, label narrowing, collapse

- **Filter** select (default Active), values and rules in BR-TASK-01..06: Active · Due Today · Overdue · Pending (upcoming) · Unscheduled · Completed. `[Implemented]` `src/pages/Tasks.jsx:46,517-529`
- Changing the filter reloads the list from the server. `[Implemented]` `src/pages/Tasks.jsx:123`
- An additional internal filter value `due` (due today or overdue) exists in the loader but is not offered in the dropdown. `[Implemented]` `src/pages/Tasks.jsx:182-183`
- **Sort** select (default Priority): Priority · Frequency · Label. Choosing any value resets label narrowing to All Labels. `[Implemented]` `src/pages/Tasks.jsx:47,530-539`
- **Label narrowing**: when Sort is Label a third select appears with **All Labels** plus every distinct label in the currently loaded list (case-insensitively de-duplicated, first-seen casing, alphabetical). Choosing one shows only active tasks whose label matches case-insensitively; tasks with no label match the literal "(No Label)". `[Implemented]` `src/pages/Tasks.jsx:48,540-555,778-781`, `src/lib/categoryUtils.js:1-10`
- **Grouping**: see BR-TASK-08 for group order and labels. Every group heading shows "(count)" and a chevron; clicking toggles that group. `[Implemented]` `src/pages/Tasks.jsx:731-747`
- **Collapse all / Expand all**: an icon button in the card header (title "Expand all" when everything is collapsed, "Collapse all" otherwise) flips the page-wide state and clears all group exceptions. `[Implemented]` `src/pages/Tasks.jsx:86-89,563-565`
- Group exceptions: when the page-wide state is collapsed, a toggled group is expanded; when it is expanded, a toggled group is collapsed. `[Implemented]` `src/pages/Tasks.jsx:73-84,732`
- The page-wide default on load is collapsed unless the device-local key `tasks_default_collapsed` is "0" (set from Settings → Task Manager). `[Implemented]` `src/pages/Tasks.jsx:70-72`, `src/pages/Settings.jsx:759-783`
- **Completed group**: only in the Completed filter, a trailing group **Completed** lists completed tasks after the active groups (with any sort). `[Implemented]` `src/pages/Tasks.jsx:762,773,788,797`
- The card title reads "Tasks (`N`)" where N is the count of the filtered list. `[Implemented]` `src/pages/Tasks.jsx:561`
- **CategoryFilter component**: a single-select dropdown labelled "Filter by category" listing label names with a check mark, where clicking the selected one clears it and clicking another replaces it; a selected label is echoed as a chip with an X and a **Clear** link. The Tasks page imports the component and filters both active and completed lists by its selection, but does not render the control, so the selection is always empty. `[Partial]` `src/components/CategoryFilter.jsx:7-106`, `src/pages/Tasks.jsx:27,49,596-599`
- Manual claims not observed as page controls: "Search tasks by keyword" (no search input exists) `[Described]` `src/pages/UserManual.jsx:127` (D-458); "sort … by due date" as a selectable sort (dates order tasks inside each group, but the dropdown offers Priority / Frequency / Label only) `[Described]` `src/pages/UserManual.jsx:126` vs `[Implemented]` `src/pages/Tasks.jsx:530-539,601-606` (D-459).

### 4.9 Dashboard widget — TODAY'S TASKS

Registry and reorder mechanics are owned by `20-features/dashboard`; this section owns the widget body. Widget id `tasks`, title **TODAY'S TASKS**, fifth in the default order. `[Implemented]` `src/pages/Dashboard.jsx:22-31,38`

- On mount the widget reads up to 200 pending tasks (newest first) and splits them: **Overdue** = `due_date` before today; **Due Today** = `due_date` equals today, or the task passes the show-today rule in `recurringTaskUtils.js` (recurrence.md §6). `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:48-73`
- Empty state (no overdue, no due today): **No pending tasks for today**. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:115-117`
- Row: checkbox, title (a sticky-note icon follows the title when the task has a description), and the priority word in its colour (BR-TASK-07). Row tooltip: "Double-click to edit notes". `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:82-105`
- Ticking flips status between completed and pending and reloads the widget. This path does not update `last_completed_date`, does not cascade to schedule items, does not create a next occurrence, and does not apply occurrence counting. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:75-80` (contrast with `src/pages/Tasks.jsx:226-322`; recorded as D-460)
- Double-click opens the same Edit Task dialog (§4.4); saving reloads the widget. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:86,176-183`
- **Overdue** section first (heading "Overdue (N)"), then Due Today. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:142-149`
- If any due-today task has a `due_time`, due-today tasks are shown under time-of-day buckets, each heading "Label (N)" with an icon, and empty buckets omitted: Morning (hour 0–11), Afternoon (12–16), Evening (17–19), Night (20–23), Anytime (no time). If no due-today task has a time, a single **Due Today (N)** list is shown instead. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:14-29,107-113,151-174`
- The list area scrolls after a fixed height. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:141`
- **Print / Email buttons** above the list open the shared date-range dialog (owned by shared-interactions) titled "Print — Select Date Range" or "Email — Select Date Range", start and end defaulting to today. Confirming reads up to 500 pending tasks, keeps those with a due date inside the range inclusive, titles the output "Tasks (start)" or "Tasks (start → end)", and prints or emails `PrintFormatTasksByDay` through the structured print mechanism (§12). `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:119-133,137-140,184-192`
- **Header badges** (owned by `20-features/dashboard`, described here because they live in this widget's header): two buttons, **Chores** (navigates to `/chores?filter=due`) and **Education** (navigates to `/education?filter=due`), each showing a count when non-zero. Colour carries meaning: purple = both overdue and due items exist; red = overdue only; blue = due only; dimmed outline = none. The counts derive from pending non-meal chores and incomplete education activities that are due today (by date, daily frequency, or weekly day match) or overdue. `[Implemented]` `src/pages/Dashboard.jsx:73-108,276-308`
- The manual says the widget shows "pending and in-progress tasks"; the widget reads only `status: "pending"`. `[Described]` `src/pages/UserManual.jsx:48` vs `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:52` (folded into D-453).

### 4.10 Realtime updates

- The page subscribes to `Task` changes and, after a 500 ms debounce, invalidates the query key `['tasks', <filter>]`. The page's own list is held in component state and refreshed by `loadTasks` on filter change and after each action, and no consumer of that query key is present on the page. `[Partial]` `src/pages/Tasks.jsx:125-138`
- The dashboard widget loads once on mount and after its own actions; it has no subscription. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:44-46,79,181`

### 4a. Keyboard & pointer

- **Double-click** on a row body opens Edit Task. `[Implemented]` `src/pages/Tasks.jsx:673`
- **Double-tap**: two clicks/taps on the row body within 300 ms open Edit Task; the timer is per render of the row. `[Implemented]` `src/pages/Tasks.jsx:644-652`
- **Hover** (mouse) reveals the delete X; **long-press** 500 ms (touch) reveals it; movement during the press cancels. Owned by shared-interactions. `[Implemented]` `src/components/SwipeableListItem.jsx:14-44`
- **Enter** in the edit dialog's Add Link input adds the link. `[Implemented]` `src/components/TaskEditDialog.jsx:302`
- **Escape / outside click** closes any of the dialogs (standard dialog behaviour); the delete-confirm dialog also clears the pending delete. `[Implemented]` `src/pages/Tasks.jsx:821`
- Clicking a link chip does not propagate to the row (no edit opens). `[Implemented]` `src/pages/Tasks.jsx:687`
- **Drag-and-drop**: none on this page.
- Dashboard widget: **double-click** opens Edit Task. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:86`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Filter | active, due-today, overdue, not-due-yet, unscheduled, completed (internal extra: due) | active | memory `src/pages/Tasks.jsx:46` |
| Sort | priority, recurrence, label | priority | memory `src/pages/Tasks.jsx:47` |
| Label narrowing | all, or one label | all | memory `src/pages/Tasks.jsx:48` |
| Page-wide collapsed | true / false | true unless device key is "0" | memory, seeded from device `tasks_default_collapsed` `src/pages/Tasks.jsx:70-72` |
| Group exceptions | set of group keys | empty | memory `src/pages/Tasks.jsx:75` |
| Batch mode + selection | boolean + set of ids | off / empty | memory `src/pages/Tasks.jsx:57-58` |
| New Task form | see §4.2 | see §4.2 | memory `src/pages/Tasks.jsx:53` |
| Walkthrough shown | boolean | derived (§9) | device `tasks_onboarded` + account `ThemeSettings.onboarding_status` |
| Print range (widget) | start, end | today / today | memory `src/components/dashboard/DashboardTasks.jsx:121-124` |

### 4c. Empty & fallback states

- Tasks list (any filter): **No tasks found** `[Implemented]` `src/pages/Tasks.jsx:591`
- Dashboard widget: **No pending tasks for today** `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:116`
- Print by day with nothing in range: **No tasks to display.** `[Implemented]` `src/components/PrintFormatTasksByDay.jsx:79`
- Edit dialog with no task: renders nothing. `[Implemented]` `src/components/TaskEditDialog.jsx:129`
- Category filter dropdown with no labels: the button renders but the dropdown panel is not shown. `[Implemented]` `src/components/CategoryFilter.jsx:52`
- Links stored as unparsable JSON are treated as no links (row and dialog). `[Implemented]` `src/pages/Tasks.jsx:653-658`, `src/components/TaskEditDialog.jsx:35-41,58-62`

## 5. Business rules

- **BR-TASK-01** Active = status is not `completed`. `[Implemented]` `src/pages/Tasks.jsx:180-181`
- **BR-TASK-02** Due Today = not completed and `due_date` equals today. `[Implemented]` `src/pages/Tasks.jsx:167-170,184-185`
- **BR-TASK-03** Overdue = not completed and `due_date` is before today (string comparison of `YYYY-MM-DD`). `[Implemented]` `src/pages/Tasks.jsx:172-175,186-187`
- **BR-TASK-04** Pending (upcoming) = not completed, has a `due_date`, and it is after today. `[Implemented]` `src/pages/Tasks.jsx:191-192`
- **BR-TASK-05** Unscheduled = not completed, no `due_date`, and not recurring. `[Implemented]` `src/pages/Tasks.jsx:188-190`
- **BR-TASK-06** Completed = status is `completed`. Any unknown filter value behaves as Active. `[Implemented]` `src/pages/Tasks.jsx:193-197`
- **BR-TASK-07** Priority values are `low`, `medium`, `high`, `urgent`; default `medium`; a missing or unknown priority is grouped as Medium. Priority is expressed as colour with three palettes: Tasks page left border urgent red-600 / high orange-500 / medium yellow-400 / low green-600; dashboard widget text urgent red-500 / high orange-500 / medium cyan-500 / low green-600; print-by-day text urgent #dc2626 / high #f97316 / medium #eab308 / low #16a34a. The manual states Low gray / Medium blue / High orange / Urgent red. `[Implemented]` `base44/entities/Task.jsonc:20-29`, `src/pages/Tasks.jsx:31-36,626-633`, `src/components/dashboard/DashboardTasks.jsx:31-36`, `src/components/PrintFormatTasksByDay.jsx:15`; `[Described]` `src/pages/UserManual.jsx:107` (D-461)
- **BR-TASK-08** Group order and headings. Priority: Urgent, High, Medium, Low. Frequency: Daily, Weekly, Biweekly, Monthly, Specific Days, X Times Total, One-time (a recurring task with no pattern counts as Daily; a non-recurring task is One-time). Label: alphabetical by first-seen casing, with "(No Label)" always last. Empty groups are omitted. `[Implemented]` `src/pages/Tasks.jsx:749-758,767-772,778-787`, `src/lib/categoryUtils.js:12-25`
- **BR-TASK-09** Inside every group, tasks are ordered by `due_date` ascending with undated tasks last; ties keep load order (newest created first). `[Implemented]` `src/pages/Tasks.jsx:601-606,141`
- **BR-TASK-10** In the Active view only, a non-completed task with a `due_date` after today is dimmed and desaturated. Other views show it normally. `[Implemented]` `src/pages/Tasks.jsx:639,643,663`
- **BR-TASK-11** The list reads at most the 100 most recently created tasks; the dashboard widget reads at most 200 pending tasks; the widget's print range reads at most 500; the mount-time deduplication reads 200. `[Implemented]` `src/pages/Tasks.jsx:141,94`, `src/components/dashboard/DashboardTasks.jsx:52,128`
- **BR-TASK-12** Labels compare case-insensitively everywhere on this page: distinct-label lists, grouping keys, narrowing, and the (unrendered) category filter. Display uses the first-seen casing. `[Implemented]` `src/lib/categoryUtils.js:1-32`, `src/pages/Tasks.jsx:541,619,780`
- **BR-TASK-13** Deleting a single task from the row always writes a trash snapshot first; batch delete and mount-time deduplication delete without a snapshot. `[Implemented]` `src/pages/Tasks.jsx:352-358,331-337,93-118`
- **BR-TASK-14** Completing or uncompleting a task from the Tasks page sets every linked schedule item's `completed` to match. `[Implemented]` `src/pages/Tasks.jsx:252-256`
- **BR-TASK-15** Editing due date or time propagates to linked schedule items' `date` and `start_time` (rule detail in §4.4). `[Implemented]` `src/components/TaskEditDialog.jsx:100-111`
- **BR-TASK-16** Link chips on the row are capped at two visible plus a "+N" remainder; the edit dialog shows all. `[Implemented]` `src/pages/Tasks.jsx:679-695`, `src/components/TaskEditDialog.jsx:253-284`
- **BR-TASK-17** A title is required to create a task; no other field is validated on create, and no field is validated on edit. `[Implemented]` `src/pages/Tasks.jsx:202`, `src/components/TaskEditDialog.jsx:81-98`
- **BR-TASK-18** The default label colour shown on a row when a label has no colour is cyan (`#06b6d4`). `[Implemented]` `src/pages/Tasks.jsx:642`
- **BR-TASK-19** Batch delete confirmation is the browser's native confirm with text "Delete N task(s)?". `[Implemented]` `src/pages/Tasks.jsx:332`
- Recurrence rules BR-TASK-20..32 are in `recurrence.md`; Google rules BR-TASK-40..47 and trash rules BR-TASK-50..53 are in `google-tasks.md`.

### 5a. State & lifecycle

`Task.status` enum: `pending` (default), `in_progress`, `completed`. `[Implemented]` `base44/entities/Task.jsonc:11-19`

| State | Trigger | Next state | Side effects | Citation |
|---|---|---|---|---|
| (none) | Create Task | `pending` | record written with form fields; form reset; list reload | `src/pages/Tasks.jsx:201-222` |
| `pending` (non-occurrence) | checkbox on Tasks page | `completed` | `last_completed_date` = today; linked schedule items `completed` = true; if recurring, next occurrence created when no pending sibling exists | `src/pages/Tasks.jsx:246-319` |
| `completed` (non-occurrence) | checkbox on Tasks page | `pending` | `last_completed_date` = null; linked schedule items `completed` = false | `src/pages/Tasks.jsx:246-256` |
| `pending` (occurrence task) | checkbox on Tasks page | `pending` or `completed` | `completed_count` + 1; status becomes `completed` only when count ≥ `occurrences`; `last_completed_date` = today | `src/pages/Tasks.jsx:231-244` |
| `completed` (occurrence task) | checkbox on Tasks page | `pending` or `completed` | `completed_count` − 1 (floor 0); status `completed` only if count still ≥ `occurrences`; `last_completed_date` unchanged | `src/pages/Tasks.jsx:231-244` |
| `pending` / `completed` | checkbox on dashboard widget | the other | none of the Tasks-page side effects | `src/components/dashboard/DashboardTasks.jsx:75-80` |
| any | Google import matches `google_task_id` | from Google (`completed` or `pending`) | see google-tasks.md | `base44/functions/syncGoogleTasks/entry.ts:58-69` |
| any | single delete | (deleted) | trash snapshot written; toast if schedule items were linked | `src/pages/Tasks.jsx:347-367` |
| any | batch delete | (deleted) | none | `src/pages/Tasks.jsx:331-337` |
| pending recurring duplicate | page mount deduplication | (deleted) | see recurrence.md §5 | `src/pages/Tasks.jsx:93-121` |
| (trash) | Restore in Settings | `pending`/as snapshotted | new record created from snapshot without the old id; trash row removed | `src/pages/Settings.jsx:197-214` |
| `in_progress` | — | — | no code path on this feature enters or leaves this state | `base44/entities/Task.jsonc:11-19` (D-453) |

Flags: `is_recurring` set on create from Frequency and on edit from the Recurring checkbox; `synced_to_schedule` and `schedule_time` are written by the Daily Schedule and daily to-do, read here for display only. `[Implemented]` `src/pages/Tasks.jsx:212,710`, `src/pages/DailySchedule.jsx:440`, `src/components/DailyToDo.jsx:162-163`

### 5b. Time & date semantics

Canonical definitions live in `10-architecture/time-and-date-semantics.md` (`AR-TIME-nn`); this page's own definitions are recorded here for comparison.

- **Today (Tasks page)** = the device's local calendar date, built by hand as `YYYY-MM-DD` from the local year, month, and day. `[Implemented]` `src/pages/Tasks.jsx:44,204-208`
- **Today (widget, show-today rule, edit dialog)** = `format(new Date(), "yyyy-MM-dd")` (local). `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:49`, `src/lib/recurringTaskUtils.js:4`
- **Due today** = `due_date === today`; **overdue** = `due_date < today`; **upcoming** = `due_date > today`; all as string comparisons on non-completed tasks. `[Implemented]` `src/pages/Tasks.jsx:167-175,191-192`, `src/components/dashboard/DashboardTasks.jsx:64-66`
- **Due date written from the New Task calendar** uses the UTC portion of the picked instant (`toISOString().split("T")[0]`), whereas the Edit Task calendar writes the local `yyyy-MM-dd`. The next-occurrence date is also written via the UTC portion while the base date is parsed from the stored string. `[Implemented]` `src/pages/Tasks.jsx:436,268,315`, `src/components/TaskEditDialog.jsx:181` (D-451)
- **Displayed dates** parse the stored date at local midnight ("T00:00:00") before formatting. `[Implemented]` `src/pages/Tasks.jsx:428,708`, `src/components/PrintFormatTasks.jsx:71`, `src/components/PrintFormatTasksByDay.jsx:9-12`
- The show-today rule parses dates with `new Date(task.due_date)` (no time suffix) when reading the weekday or day-of-month. `[Implemented]` `src/lib/recurringTaskUtils.js:5,24,33,37`

## 6. Data

Entity detail lives in `10-architecture/data-model/`. This feature:

- **Owns** `E-Task` (all fields: `title` required; `description`; `status`; `priority`; `due_date`; `due_time`; `category`; `category_color`; `is_recurring`; `recurrence_pattern`; `occurrences`; `completed_count`; `days_of_week`; `last_completed_date`; `google_task_id`; `synced_to_schedule`; `schedule_time`; `links` as a JSON-array string). `[Implemented]` `base44/entities/Task.jsonc:1-95`
  - Operations here: create (`src/pages/Tasks.jsx:218,306-317`), filter with `-created_date` limit 100 / 200 (`:141,94`), update (`:235-239,247-250`, `src/components/TaskEditDialog.jsx:85-98`, `src/components/dashboard/DashboardTasks.jsx:76-78`), filter by title+pattern+status (`:260-265`), delete (`:361,333,114`), subscribe (`:128`); widget filter `{status: "pending"}` `-created_date` limit 200 / 500 (`src/components/dashboard/DashboardTasks.jsx:52,128`).
- **Writes** `E-TrashBin` (`item_type` "task", `item_id`, `item_data`, `deleted_at`) on single delete. `[Implemented]` `src/pages/Tasks.jsx:352-358`, `base44/entities/TrashBin.jsonc:1-30`
- **Reads and updates** `E-ScheduleItem` by `source_id` (completion cascade, date/time propagation, deletion notice). `[Implemented]` `src/pages/Tasks.jsx:253-256,360`, `src/components/TaskEditDialog.jsx:102-109`
- **Reads/writes** `E-ThemeSettings.onboarding_status` for the walkthrough (§9). `[Implemented]` `src/pages/Tasks.jsx:61-69`, `src/components/onboarding/TasksOnboarding.jsx:32-45`
- **Referenced by** `E-ThemeSettings.task_sync_category`, `task_sync_color`, `sync_sources` and `E-SelectedTaskLists` (google-tasks.md). `[Implemented]` `base44/entities/ThemeSettings.jsonc:71-86`
- The transient create-form key `frequency` is included in the create payload though it is not a schema field. `[Implemented]` `src/pages/Tasks.jsx:209-217`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Daily Schedule (schedule hub) | completion cascade to every `ScheduleItem` with `source_id` = task id | `src/pages/Tasks.jsx:252-256` |
| out | Daily Schedule | due date/time edits update linked `ScheduleItem.date` / `start_time` | `src/components/TaskEditDialog.jsx:100-111` |
| out | Daily Schedule | deleting a task with linked items shows the notice in §4.6; the items are not written by this page | `src/pages/Tasks.jsx:360-364` |
| in | Daily Schedule | placing a task on the grid writes `due_date` and `schedule_time` on the task; the row shows `schedule_time` when no `due_time` | `src/pages/DailySchedule.jsx:438-440`, `src/pages/Tasks.jsx:710` |
| in | Daily to-do | task-sourced rows open this feature's Edit Task dialog; the host supplies **Hide from Schedule**, which hides that day's linked schedule item from the grid; ticking a task-sourced row writes the task's status (owned by daily-schedule) | `src/components/DailyToDo.jsx:292-300,333-347,119,159-163` |
| in | Daily to-do | tasks due today are synthesised into the to-do list as `due-task-<id>` rows (owned by daily-schedule) | `src/components/DailyToDo.jsx:37,57` |
| in | Daily Schedule item library | unscheduled tasks appear in the item library (owned by daily-schedule) | `src/pages/DailySchedule.jsx:235,503-509` |
| out | Dashboard | TODAY'S TASKS widget body (§4.9) | `src/pages/Dashboard.jsx:38` |
| out | Chores | widget header badge → `/chores?filter=due` | `src/pages/Dashboard.jsx:280` |
| out | Education | widget header badge → `/education?filter=due` | `src/pages/Dashboard.jsx:295` |
| in | Settings | Task Manager card sets `tasks_default_collapsed`; Trash Bin card restores tasks; Integrations and Sync dialog drive Google Tasks | `src/pages/Settings.jsx:759-783,987-1052,809-862,1111-1154` |
| both | Google Tasks | import via `syncGoogleTasks` / `autoSync`; push of due date via `updateGoogleTask`; delete choice dialog | google-tasks.md |
| in | Goals | shares `categoryUtils` helpers for label de-duplication and grouping (Goals binding owned by goals) | `src/pages/Goals.jsx:21` |
| out | Shared label history | create/edit save the label to `app_label_history` (owned by shared-interactions) | `src/pages/Tasks.jsx:203`, `src/components/TaskEditDialog.jsx:84` |

### 7a. Feedback & notifications

- Notice (bottom-right, dismissible with ✕): **Task deleted. It was also removed from the Daily Schedule.** — shown only when linked schedule items existed. `[Implemented]` `src/pages/Tasks.jsx:362-364,813-818`
- Confirm dialog (shared): **Delete Item?** / **This action cannot be undone.** `[Implemented]` `src/components/SwipeableListItem.jsx:126-127`
- Confirm dialog: **Delete Task** / **This task is synced with Google Tasks. Would you like to delete it from Google Tasks as well?** `[Implemented]` `src/pages/Tasks.jsx:824-827`
- Browser confirm: **Delete N task(s)?** `[Implemented]` `src/pages/Tasks.jsx:332`
- Browser alert after email: **Sent to your email!** (Tasks page and, through the shared mechanism, the widget). `[Implemented]` `src/pages/Tasks.jsx:583`, `src/lib/printUtils.js:23`
- Edit dialog static note: **Synced with Google Tasks**. `[Implemented]` `src/components/TaskEditDialog.jsx:155`
- Save spinner on the edit dialog's Save button. `[Implemented]` `src/components/TaskEditDialog.jsx:324-327`
- Celebratory effects, reminders: none observed.

## 8. AI & automation

- No LLM touchpoint in this feature. `[Implemented]` (no `InvokeLLM` call in owned files)
- Scheduled automation: the `autoSync` function imports Google Tasks at the account's scheduled sync times when `sync_sources` includes "tasks"; owned by `10-architecture/google-sync.md` / `automations.md`. `[Implemented]` `base44/functions/autoSync/entry.ts:16-18,113-132`

## 9. Onboarding content

Dialog title **Welcome to Task Manager**; subtitle **Here's how to get the most out of this page — it only takes a minute!**; single button **Got it — Don't Remind Me Again**. `[Implemented]` `src/components/onboarding/TasksOnboarding.jsx:51-54,68-70`

Steps, verbatim (`src/components/onboarding/TasksOnboarding.jsx:8-29`) `[Described]`:

1. **1. Create & Prioritize Tasks** — "Click 'Add Task' to create a task with a title, description, priority (Low, Medium, High, Urgent), due date, and time. Click the checkbox to mark it complete. Double-tap or double-click any task to edit it inline."
2. **2. Use Labels & Categories** — "Assign a custom label and color to each task for easy grouping. The app remembers your recently used labels so you can quickly reapply them. Switch the sort view to 'Group by Label' to focus on one area at a time."
3. **3. Set Recurring Tasks** — "Set a task to repeat Daily, Weekly, or Monthly. Weekly tasks let you pick specific days of the week. When you complete a recurring task it automatically resets for the next due period — perfect for habits and routines."
4. **4. Filter, Sort & Add to Schedule** — "Filter by Active, Due Today, Overdue, Upcoming, or Completed. Use 'Select' for batch deletion. Swipe left on any task to delete it. Tasks with a due date and time can be pushed directly to the Daily Schedule — they'll appear as time blocks on the grid."

- Dismissal key: `tasks_onboarded`. Persistence generation: server-synced — the key is written to device storage and to the `tasks_onboarded` entry of the JSON map in `ThemeSettings.onboarding_status` (creating a ThemeSettings record if none exists). `[Implemented]` `src/components/onboarding/TasksOnboarding.jsx:6,32-45`
- Trigger on page load: skip if the device key is "true"; otherwise read the latest ThemeSettings — show the walkthrough if there is none or the map lacks the key; if the map has it, mirror it to the device key and do not show; on read failure, show. Closing the dialog by outside click or Escape closes it without persisting. `[Implemented]` `src/pages/Tasks.jsx:61-69`, `src/components/onboarding/TasksOnboarding.jsx:48`
- The header **Guide** button reopens it at any time. `[Implemented]` `src/pages/Tasks.jsx:43`
- Registry lives in `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `tasks_default_collapsed` | "1" = start with all groups collapsed; "0" = expanded | absent (treated as collapsed) | Settings → Task Manager → "Default task list collapsed" toggle (`src/pages/Settings.jsx:766-771`) | nothing in-app |
| `tasks_onboarded` | "true" when the walkthrough has been dismissed | absent | walkthrough button (`src/components/onboarding/TasksOnboarding.jsx:33`), or page trigger when the account map already has it (`src/pages/Tasks.jsx:67`) | nothing in-app |
| `app_label_history` | shared label history (owned by shared-interactions) | — | create/edit via `saveLabelToHistory` (`src/pages/Tasks.jsx:203`, `src/components/TaskEditDialog.jsx:84`) | owner spec |

## 11. Seed / hardcoded data used

- Priority set and default: `low`, `medium`, `high`, `urgent`; default `medium`. `[Implemented]` `base44/entities/Task.jsonc:20-29`, `src/pages/Tasks.jsx:53`
- Recurrence patterns and UI labels (create): One-time, Daily, Weekly, Biweekly (Every 2 Weeks), Monthly, Specific Days of Week, X Times Total; (edit): Daily, Weekly, Biweekly, Monthly, Specific Days of Week, X Times Total; (group headings): Daily, Weekly, Biweekly, Monthly, Specific Days, X Times Total, One-time. `[Implemented]` `src/pages/Tasks.jsx:467-473,624,751`, `src/components/TaskEditDialog.jsx:212-217`
- Day names: create dialog order Mon…Sun; edit dialog order Sun…Sat; both store three-letter English names. `[Implemented]` `src/pages/Tasks.jsx:492`, `src/components/TaskEditDialog.jsx:20`
- Time-of-day buckets for the widget (see §4.9). `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:14-20`
- Literal "(No Label)" group key. `[Implemented]` `src/lib/categoryUtils.js:17`, `src/components/PrintFormatTasks.jsx:16`
- Default label colour `#06b6d4`. `[Implemented]` `src/pages/Tasks.jsx:642`
- Read limits 100 / 200 / 500 (BR-TASK-11).
- Debounce 500 ms (realtime), tap window 300 ms, long-press 500 ms. `[Implemented]` `src/pages/Tasks.jsx:131,647`, `src/components/SwipeableListItem.jsx:23`
- Seed data catalogue: `10-architecture/data-model/seed-data.md`.

## 12. Print / email formats

Mechanism ownership: `10-architecture/export-print-email.md`. This feature owns two format components.

**From the Tasks page (card header Print / Email icons)** `[Implemented]` `src/pages/Tasks.jsx:566-586`

- Input: the currently filtered list (all groups, ignoring collapse state and label narrowing). Grouping is by label when Sort is Label, otherwise by priority.
- Print: the component is rendered to static markup and written into a new blank window titled "Tasks", then the browser print dialog opens immediately. This path does not use the shared `printUtils` stylesheet or delay.
- Email: the same markup is sent through the platform email integration to the signed-in user's address with subject **Task List**, then the alert "Sent to your email!" is shown.

**`PrintFormatTasks`** `[Implemented]` `src/components/PrintFormatTasks.jsx:4-130`

- Heading **Task List**; line "Generated: <weekday, month day, year> · N active task(s)".
- Active tasks grouped by priority (Urgent, High, Medium, Low; unknown → Medium; empty groups omitted) or by label (alphabetical, "(No Label)" last; every non-empty label group). Group heading "LABEL (count)".
- Row: a drawn checkbox (filled when completed); title (struck through and greyed when completed); description; a "↻ pattern" line for recurring tasks with underscores shown as spaces; right column: "Due: MMM d", due time as stored, and the label uppercase in its colour.
- A trailing dimmed **Completed (N)** section lists completed tasks in the input.
- Nothing is remembered between prints.

**From the dashboard widget (Print / Email icons above the list)** `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:119-133,184-192`

- Options dialog: the shared date-range dialog with **Date Range** start and end inputs and a confirm button reading **Print** or **Email**; both dates default to today; nothing is remembered.
- Input: pending tasks with a `due_date` inside the inclusive range.
- Output title: "Tasks (start)" when start equals end, otherwise "Tasks (start → end)". Uses the shared structured print (`printComponent`, which prints after a 300 ms delay) or `emailComponent` (subject = title).

**`PrintFormatTasksByDay`** `[Implemented]` `src/components/PrintFormatTasksByDay.jsx:17-117`

- Heading = the given title; line "Generated: <date> · N task(s)".
- Only non-completed tasks are included. Grouped by `due_date` ascending, heading "<Weekday, Month day> (count)"; then a **No Due Date (N)** section if any.
- Row: empty checkbox; title; description; "↻ pattern"; right column: due time in 12-hour form ("9 AM", "2:30 PM"), the priority word uppercase in its colour (BR-TASK-07), and the label uppercase in its colour.
- Empty result: "No tasks to display."

## 13. Acceptance criteria

- **AC-TASK-01** Given the New Task dialog with an empty Title, when the user presses Create Task, then nothing is created and the dialog stays open. (refs BR-TASK-17)
- **AC-TASK-02** Given Frequency "X Times Total" and "How many times?" = 3, when the task is created, then it is stored with `is_recurring` true, `recurrence_pattern` "occurrences", `occurrences` 3, `completed_count` 0. (refs §4.2)
- **AC-TASK-03** Given a pending non-recurring task with two linked schedule items, when the user ticks its checkbox, then the task is `completed` with `last_completed_date` = today and both schedule items have `completed` true. (refs BR-TASK-14)
- **AC-TASK-04** Given the Active filter, when the list renders, then every non-completed task is shown, and those with a due date after today are dimmed and desaturated. (refs BR-TASK-01, BR-TASK-10)
- **AC-TASK-05** Given the filter is Due Today, when the list renders, then only non-completed tasks whose `due_date` equals the device's local date are shown. (refs BR-TASK-02)
- **AC-TASK-06** Given the filter is Unscheduled, when the list renders, then only non-completed tasks with no due date and `is_recurring` false are shown. (refs BR-TASK-05)
- **AC-TASK-07** Given Sort = Priority, when the list renders, then groups appear in the order Urgent, High, Medium, Low, empty groups omitted, and each group's tasks are ordered by due date with undated last. (refs BR-TASK-08, BR-TASK-09)
- **AC-TASK-08** Given Sort = Label and tasks labelled "Work", "work", and none, when the list renders, then one group "Work" (first-seen casing) holds both labelled tasks and "(No Label)" is the last group. (refs BR-TASK-08, BR-TASK-12)
- **AC-TASK-09** Given Sort = Label, when the user chooses a label in the third dropdown, then only that label's group is shown; choosing another Sort value resets the dropdown to All Labels. (refs §4.8)
- **AC-TASK-10** Given the device key `tasks_default_collapsed` is absent, when the page loads, then every group is collapsed; clicking one group heading expands only that group; clicking the header expand-all button expands all and forgets the exception. (refs §4.8)
- **AC-TASK-11** Given a task with three links, when its row renders, then two hostname chips and "+1" are shown, and clicking a chip opens the URL without opening the editor. (refs BR-TASK-16)
- **AC-TASK-12** Given a task row, when the user double-clicks it (or taps twice within 300 ms), then the Edit Task dialog opens seeded with every field of that task. (refs §4.4)
- **AC-TASK-13** Given the Edit Task dialog for a task with one linked schedule item, when the user changes the due date and time and saves, then the task and the schedule item's `date` and `start_time` reflect the new values. (refs BR-TASK-15)
- **AC-TASK-14** Given a task without a Google id, when the user reveals and presses its delete button and confirms "Delete", then a TrashBin row with the task's JSON exists and the task is gone. (refs BR-TASK-13)
- **AC-TASK-15** Given a task with a Google id, when the user confirms the shared delete dialog, then the three-button "Delete Task" dialog appears with the verbatim text in §4.6. (refs §4.6)
- **AC-TASK-16** Given batch mode with two tasks selected, when the user presses Delete and accepts "Delete 2 task(s)?", then both are deleted, no TrashBin rows are written, and batch mode ends. (refs BR-TASK-13, BR-TASK-19)
- **AC-TASK-17** Given a task with a description, when the user clicks the note icon, then a dialog titled with the task's title shows the description. (refs §4.5)
- **AC-TASK-18** Given the dashboard widget with one task due yesterday and two due today (one at 08:00, one at 19:30), when it renders, then "Overdue (1)" precedes "Morning (1)" and "Evening (1)" and no other bucket heading appears. (refs §4.9)
- **AC-TASK-19** Given the dashboard widget with due-today tasks none of which has a time, when it renders, then a single "Due Today (N)" list is shown. (refs §4.9)
- **AC-TASK-20** Given the Tasks page with Sort = Label, when the user presses Print, then the printed document is titled "Task List" and grouped by label with "(No Label)" last. (refs §12)
- **AC-TASK-21** Given the widget print dialog with a range covering two dates, when confirmed, then the output is titled "Tasks (start → end)", grouped by date with a trailing "No Due Date" section only if undated tasks fell in the input (none can, so it is absent). (refs §12)
- **AC-TASK-22** Given the device key `tasks_onboarded` absent and the account's onboarding map containing `tasks_onboarded: true`, when the page loads, then the walkthrough is not shown and the device key is set to "true". (refs §9)
- **AC-TASK-23** Given the walkthrough is open, when the user presses "Got it — Don't Remind Me Again", then both the device key and the account map record `tasks_onboarded`. (refs §9)

## 14. Discrepancies & open questions

- **D-450** The manual and onboarding say click **"Add Task"** (`src/pages/UserManual.jsx:106`, `src/components/onboarding/TasksOnboarding.jsx:12`); the page renders an icon-only plus button (`src/pages/Tasks.jsx:393`).
- **D-451** The New Task calendar stores the picked date via the UTC date string (`src/pages/Tasks.jsx:436`) and the next-occurrence date via the UTC date string (`src/pages/Tasks.jsx:315`); the Edit Task calendar stores the local formatted date (`src/components/TaskEditDialog.jsx:181`) and "today" is the local date (`src/pages/Tasks.jsx:44`).
- **D-452** The manual describes an "Is Recurring" toggle on create (`src/pages/UserManual.jsx:117`); the create dialog uses a Frequency select including One-time (`src/pages/Tasks.jsx:463-475`), while the edit dialog uses a "Recurring task" checkbox (`src/components/TaskEditDialog.jsx:202-203`).
- **D-453** The manual describes a Pending → In Progress → Completed status circle and a widget showing "pending and in-progress tasks" (`src/pages/UserManual.jsx:108,48`); the schema has `in_progress` (`base44/entities/Task.jsonc:11-19`), but the page toggles only pending ↔ completed (`src/pages/Tasks.jsx:246-250`) and the widget reads only `pending` (`src/components/dashboard/DashboardTasks.jsx:52`).
- **D-454** The manual says edit opens "by clicking the task row" (`src/pages/UserManual.jsx:110`); the page opens it on double-click or double-tap within 300 ms (`src/pages/Tasks.jsx:644-652,673`); onboarding says "Double-tap or double-click" (`src/components/onboarding/TasksOnboarding.jsx:12`).
- **D-455** The manual says tasks are pushed to the Daily Schedule "by selecting a specific time slot from the task editor" (`src/pages/UserManual.jsx:130`); the edit dialog has no such control (`src/components/TaskEditDialog.jsx:131-331`); placement happens on the Daily Schedule page (`src/pages/DailySchedule.jsx:438-440`).
- **D-456** The manual says delete is "via the action menu" (`src/pages/UserManual.jsx:111`); the row reveals a delete button on hover or long-press (`src/components/SwipeableListItem.jsx:14-23,109-119`).
- **D-457** Onboarding says "Swipe left on any task to delete it" (`src/components/onboarding/TasksOnboarding.jsx:27`); the task row component has hover/long-press reveal and no swipe handling (`src/components/SwipeableListItem.jsx:14-44`).
- **D-458** The manual says "Search tasks by keyword" (`src/pages/UserManual.jsx:127`); no search control exists on the page (`src/pages/Tasks.jsx:515-559`).
- **D-459** The manual says filter and sort "by status, priority, due date, or category" (`src/pages/UserManual.jsx:126`); the sort dropdown offers Priority, Frequency, Label (`src/pages/Tasks.jsx:530-539`), with due date used only as the in-group order (`src/pages/Tasks.jsx:601-606`).
- **D-460** Ticking a task on the Tasks page sets `last_completed_date`, cascades to schedule items, and creates the next occurrence (`src/pages/Tasks.jsx:226-322`); ticking the same task in the dashboard widget flips `status` only (`src/components/dashboard/DashboardTasks.jsx:75-80`).
- **D-461** Priority colours: manual Low gray / Medium blue / High orange / Urgent red (`src/pages/UserManual.jsx:107`); Tasks page border red-600 / orange-500 / yellow-400 / green-600 (`src/pages/Tasks.jsx:31-36`); widget text red-500 / orange-500 / cyan-500 / green-600 (`src/components/dashboard/DashboardTasks.jsx:31-36`); print-by-day #dc2626 / #f97316 / #eab308 / #16a34a (`src/components/PrintFormatTasksByDay.jsx:15`).
- **D-462** Onboarding step 4 lists filters "Active, Due Today, Overdue, Upcoming, or Completed" (`src/components/onboarding/TasksOnboarding.jsx:27`); the dropdown reads Active, Due Today, Overdue, Pending (upcoming), Unscheduled, Completed (`src/pages/Tasks.jsx:522-527`).
- **D-463** Onboarding step 2 names the sort view "Group by Label" (`src/components/onboarding/TasksOnboarding.jsx:17`); the dropdown option reads "Label" (`src/pages/Tasks.jsx:537`).
- **D-464** Onboarding step 3 says recurrence is "Daily, Weekly, or Monthly" with days on Weekly (`src/components/onboarding/TasksOnboarding.jsx:22`); the create dialog also offers Biweekly, Specific Days of Week, and X Times Total (`src/pages/Tasks.jsx:467-473`).
- Recurrence discrepancies D-470..D-476 are in `recurrence.md`; Google/trash discrepancies D-480..D-486 are in `google-tasks.md`.
- **Q-450** Blocks: §4.10. Question: is the realtime subscription intended to refresh the visible list (no consumer of the invalidated query key is present on the page — `src/pages/Tasks.jsx:125-138`)?
- **Q-451** Blocks: §4.8. Question: is the unrendered CategoryFilter control (`src/pages/Tasks.jsx:27,49,596-599`) intended to appear on the Tasks page, and if so where relative to the Sort/Label controls?
- **Q-452** Blocks: §4.6, §4.7. Question: is batch delete intended to write trash snapshots and offer the Google choice like single delete (`src/pages/Tasks.jsx:331-337` vs `:347-367`)?
- **Q-453** Blocks: §5a. Question: is the `in_progress` status meant to be reachable from the Tasks page as the manual describes (D-453)?
