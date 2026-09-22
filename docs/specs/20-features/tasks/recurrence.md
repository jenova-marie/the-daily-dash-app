# Tasks — Recurrence (Level 2)

**Feature code:** `TASK` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 29 · Described 4 · Partial 1

**Sources owned:** `src/pages/Tasks.jsx` (recurrence portions), `src/components/TaskEditDialog.jsx` (recurrence portions), `src/lib/recurringTaskUtils.js`, `src/components/dashboard/DashboardTasks.jsx` (show-today binding)
**Sources referenced:** `base44/entities/Task.jsonc` → `10-architecture/data-model/`; `src/pages/UserManual.jsx`, `src/components/onboarding/TasksOnboarding.jsx` → quoted for claims.

This document holds every rule about how a task repeats: the patterns and their labels, occurrence tasks, what happens when a recurring task is completed, the "completed this period" helper, the mount-time deduplication, and the separate show-today rule used by the dashboard widget. Where two code paths express different rules, both are recorded and a `D-` entry is opened.

## 1. Recurrence patterns

- **BR-TASK-20** A task is recurring when `is_recurring` is true; its pattern is one of `daily`, `weekly`, `biweekly`, `monthly`, `days_of_week`, `occurrences`. A non-recurring task has `is_recurring` false and a null pattern. `[Implemented]` `base44/entities/Task.jsonc:43-57`, `src/pages/Tasks.jsx:212-213`, `src/components/TaskEditDialog.jsx:94-95`

| Stored pattern | Create dialog label (Frequency) | Edit dialog label (pattern select) | Group heading (Sort = Frequency) | Print line |
|---|---|---|---|---|
| (none, `is_recurring` false) | One-time | (Recurring task unticked) | One-time | (none) |
| `daily` | Daily | Daily | Daily | ↻ daily |
| `weekly` | Weekly | Weekly | Weekly | ↻ weekly |
| `biweekly` | Biweekly (Every 2 Weeks) | Biweekly | Biweekly | ↻ biweekly |
| `monthly` | Monthly | Monthly | Monthly | ↻ monthly |
| `days_of_week` | Specific Days of Week | Specific Days of Week | Specific Days | ↻ days of week |
| `occurrences` | X Times Total | X Times Total | X Times Total | ↻ occurrences |

`[Implemented]` `src/pages/Tasks.jsx:467-473,624,751`, `src/components/TaskEditDialog.jsx:212-217`, `src/components/PrintFormatTasks.jsx:63-67`, `src/components/PrintFormatTasksByDay.jsx:49-53`

- **BR-TASK-21** Days of week. Create: seven checkboxes in the order Mon, Tue, Wed, Thu, Fri, Sat, Sun, shown for Weekly (heading "Days of Week (optional)") and Specific Days of Week (heading "Select Days"); changing Frequency clears the chosen days. Edit: seven toggle buttons in the order Sun, Mon, Tue, Wed, Thu, Fri, Sat, shown for Weekly and Specific Days of Week. Stored as an array of three-letter English day names in `days_of_week`. On edit-save the array is kept only when the pattern is Weekly or Specific Days of Week, otherwise it is emptied. `[Implemented]` `src/pages/Tasks.jsx:464,488-506`, `src/components/TaskEditDialog.jsx:20,66-68,96,220-237`
- **BR-TASK-22** A recurring task with no stored pattern is treated as Daily for grouping purposes. `[Implemented]` `src/pages/Tasks.jsx:611,754`
- **BR-TASK-23** The edit dialog's pattern select defaults to Weekly when the task has no pattern; its Recurring checkbox defaults to the task's `is_recurring`. `[Implemented]` `src/components/TaskEditDialog.jsx:31-32,55`
- Manual: "Set frequency to **Daily, Weekly** (choose specific days), or **Monthly**." `[Described]` `src/pages/UserManual.jsx:118` (D-473: four further options exist).
- Onboarding: "Set a task to repeat Daily, Weekly, or Monthly. Weekly tasks let you pick specific days of the week." `[Described]` `src/components/onboarding/TasksOnboarding.jsx:22` (spec.md D-464).

## 2. Occurrence tasks (pattern `occurrences`)

- **BR-TASK-24** Creating a task with Frequency "X Times Total" stores `is_recurring` true, `recurrence_pattern` "occurrences", `occurrences` = the "How many times?" value (min 1, non-numeric → 1), and `completed_count` 0. Any other frequency stores `occurrences` null and `completed_count` null. `[Implemented]` `src/pages/Tasks.jsx:207-216,477-487`
- **BR-TASK-25** Ticking an occurrence task's checkbox on the Tasks page: if the task is currently `completed`, `completed_count` decreases by 1 (floor 0); otherwise it increases by 1. The status becomes `completed` when the new count is greater than or equal to `occurrences` (treated as 1 when missing), else `pending`. `last_completed_date` is set to today only when the count increased. The occurrence path returns before the schedule-item cascade and before next-occurrence creation, so neither applies to occurrence tasks. `[Implemented]` `src/pages/Tasks.jsx:231-244`
- **BR-TASK-26** Progress display: a row whose pattern is `occurrences` and whose `occurrences` is greater than 1 shows "`completed_count`/`occurrences` done" and a bar filled to `round(completed_count / occurrences × 100)` percent. A task with `occurrences` of 1 shows no progress line. `[Implemented]` `src/pages/Tasks.jsx:698-705`
- **BR-TASK-27** Editing: the "Total occurrences" input (min 1, non-numeric → 1) is shown only for X Times Total. On save, `occurrences` takes the input for X Times Total and otherwise keeps the task's stored value; `completed_count` is never written by the edit dialog. `[Implemented]` `src/components/TaskEditDialog.jsx:34,57,97,238-249`
- The dashboard widget's checkbox flips an occurrence task's `status` directly, without touching `completed_count`. `[Implemented]` `src/components/dashboard/DashboardTasks.jsx:75-80` (spec.md D-460)
- Google-imported tasks never carry occurrence fields. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:58-66`

## 3. Completion → next occurrence

Applies on the Tasks page only, to recurring tasks whose pattern is not `occurrences`, when the checkbox moves the task to `completed`. `[Implemented]` `src/pages/Tasks.jsx:246-258`

- **BR-TASK-28 Sibling check.** Before creating anything, the page looks for tasks with the same `title`, `is_recurring` true, the same `recurrence_pattern`, and status `pending`. If any exists, no next occurrence is created. Label, days, due date, and description are not part of the match. The task just completed no longer matches because its status was already written as `completed`. `[Implemented]` `src/pages/Tasks.jsx:260-267`
- **BR-TASK-29 Base date.** The next date starts from the task's `due_date` (parsed from the stored string) or, when the task has no due date, from the current moment. `[Implemented]` `src/pages/Tasks.jsx:268`
- **BR-TASK-30 Date computation per pattern.** `[Implemented]` `src/pages/Tasks.jsx:269-304`

| Pattern | Next `due_date` | Citation |
|---|---|---|
| `daily` | base + 1 day | `:269` |
| `weekly` with one or more `days_of_week` | the first day among base+1 … base+7 whose local weekday name is in `days_of_week`; if none matches, base + 7 days | `:270-284` |
| `weekly` with no days | base + 7 days | `:285` |
| `biweekly` | base + 14 days | `:286` |
| `days_of_week` | the first day among base+1 … base+7 whose local weekday name is in `days_of_week`; if none matches (including an empty list), base + 1 day | `:287-303` |
| `monthly` | base with the month advanced by 1 (native month arithmetic) | `:304` |
| any other value | base unchanged | (no branch) |

- **BR-TASK-31 The clone.** A new task is created with: the same title, description, priority, label, label colour, due time, `is_recurring` true, the same pattern, and the same `days_of_week` (empty array when none). Its `due_date` is the computed date written through the UTC date string (spec.md D-451). Not copied: `links`, `occurrences`, `completed_count`, `google_task_id`, `schedule_time`, `synced_to_schedule`, `last_completed_date`; status defaults to `pending`. The completed original remains as a completed record. `[Implemented]` `src/pages/Tasks.jsx:306-317`
- **BR-TASK-32** Uncompleting a recurring task does not remove a previously created next occurrence. `[Implemented]` `src/pages/Tasks.jsx:246-258` (no branch on uncompletion)
- The next occurrence has no linked schedule items; the original's linked items were marked completed by the cascade (spec.md BR-TASK-14). `[Implemented]` `src/pages/Tasks.jsx:252-256,306-317`
- Manual: "Recurring tasks **reset automatically** at the start of the next cycle after completion." Onboarding: "When you complete a recurring task it automatically resets for the next due period". In the prototype the reset takes the form of an immediately created pending sibling dated to the next period, rather than a change to the completed task. `[Described]` `src/pages/UserManual.jsx:119`, `src/components/onboarding/TasksOnboarding.jsx:22`; `[Implemented]` `src/pages/Tasks.jsx:258-319`

## 4. "Completed this period" rule

- A helper inside the list loader defines when a recurring task counts as completed for its current period, based on `last_completed_date`: no date → false; `daily` → completed today; `weekly` → completed fewer than 7 days ago (and not in the future); `biweekly` → fewer than 14 days ago; `days_of_week` → completed today; `monthly` → same `YYYY-MM` as today; any other pattern → false. `[Implemented]` `src/pages/Tasks.jsx:145-165`
- No filter branch calls this helper; the list's filters use only status and `due_date` (spec.md BR-TASK-01..06). `[Partial]` `src/pages/Tasks.jsx:179-198` (Q-455)

## 5. Mount-time deduplication

- Each time the Tasks page mounts it reads up to 200 tasks (newest first), takes those that are recurring and `pending`, and groups them by the key `title||recurrence_pattern`. `[Implemented]` `src/pages/Tasks.jsx:93-99,121`
- Within a group, one task is kept and the rest are deleted according to, for each later task `t` against the currently kept task `k`: if `t` has no due date, or both have due dates and `t`'s is later than `k`'s, `t` is deleted; otherwise `k` is deleted and `t` becomes the kept task. The result keeps the task with the earliest due date; a dated task displaces an undated one; among equal dates the later-loaded (older-created) task is kept; among all-undated tasks the first loaded (newest-created) is kept. `[Implemented]` `src/pages/Tasks.jsx:100-113`
- Deletions on this path write no trash snapshot and show no notice; the list then reloads. `[Implemented]` `src/pages/Tasks.jsx:114-117`
- Label, description, `days_of_week`, and `google_task_id` play no part in the key, so two pending recurring tasks sharing a title and pattern are always reduced to one. `[Implemented]` `src/pages/Tasks.jsx:99`

## 6. Show-today rule (`recurringTaskUtils.js`)

A separate, self-contained rule decides whether a task is shown today. It is used only by the dashboard TODAY'S TASKS widget, as the second half of its Due Today test (`due_date === today || shouldTaskShowToday(t)`), after the widget has already routed `due_date < today` tasks to Overdue. `[Implemented]` `src/lib/recurringTaskUtils.js:3-44`, `src/components/dashboard/DashboardTasks.jsx:6,61-69`

| Condition (evaluated in order) | Result | Citation |
|---|---|---|
| has `due_date`, `due_date <= today`, and status `pending` | show | `:9-11` |
| not recurring | do not show | `:14` |
| `daily` | show | `:16-18` |
| `weekly` with a `due_date` | show when the `due_date`'s weekday equals today's weekday | `:20-26` |
| `weekly` without a `due_date` | show | `:27` |
| `monthly` with a `due_date` | show when the `due_date`'s day-of-month equals today's | `:30-35` |
| `monthly` without `due_date` but with `last_completed_date` | show when that date's day-of-month equals today's | `:36-39` |
| `monthly` with neither | show | `:40` |
| `biweekly`, `days_of_week`, `occurrences`, other | do not show | `:43` |

- Dates in this rule are parsed with `new Date(<YYYY-MM-DD>)` and the weekday/day-of-month read in local time. `[Implemented]` `src/lib/recurringTaskUtils.js:5,24,33,37` (see spec.md §5b)
- The Tasks page does not use this rule; its Due Today filter is `due_date === today` only. `[Implemented]` `src/pages/Tasks.jsx:167-170`

## 7. Editing recurrence without affecting history

- Manual: "Edit the recurrence pattern anytime without affecting completion history." `[Described]` `src/pages/UserManual.jsx:120`
- The edit dialog writes `is_recurring`, `recurrence_pattern`, `days_of_week`, and `occurrences` as described in BR-TASK-21 and BR-TASK-27 and never writes `completed_count` or `last_completed_date`, so counts and the last-completed date survive a pattern change. Completed sibling records created by earlier completions are separate tasks and are untouched. `[Implemented]` `src/components/TaskEditDialog.jsx:85-98`
- Turning Recurring off stores `recurrence_pattern` null and empties `days_of_week`; `occurrences` keeps its stored value. `[Implemented]` `src/components/TaskEditDialog.jsx:95-97`

## 8. Acceptance criteria

- **AC-TASK-30** Given a pending daily task due 2026-09-20 with no pending sibling of the same title and pattern, when it is ticked on the Tasks page, then it becomes completed with `last_completed_date` today and a new pending daily task with the same title, label, colour, description, priority, and due time exists dated 2026-09-21. (refs BR-TASK-28..31)
- **AC-TASK-31** Given a pending weekly task due Monday 2026-09-21 with days Wed and Fri, when ticked, then the next occurrence is dated Wednesday 2026-09-23. (refs BR-TASK-30)
- **AC-TASK-32** Given a pending Specific Days task with an empty day list due 2026-09-20, when ticked, then the next occurrence is dated 2026-09-21. (refs BR-TASK-30)
- **AC-TASK-33** Given a recurring task that already has a pending sibling with the same title and pattern, when ticked, then no new task is created. (refs BR-TASK-28)
- **AC-TASK-34** Given an X Times Total task with `occurrences` 3 and `completed_count` 1, when ticked, then `completed_count` is 2, status stays pending, the row reads "2/3 done", and no next occurrence or schedule cascade occurs; when ticked again, status becomes completed. (refs BR-TASK-25, BR-TASK-26)
- **AC-TASK-35** Given a completed X Times Total task with `completed_count` 3 of 3, when ticked, then `completed_count` is 2 and status is pending. (refs BR-TASK-25)
- **AC-TASK-36** Given two pending weekly tasks titled "Water plants" due 2026-09-22 and 2026-09-29, when the Tasks page mounts, then the one due 2026-09-29 is deleted with no trash snapshot. (refs §5)
- **AC-TASK-37** Given a pending weekly task due next Thursday and today is Thursday, when the dashboard widget loads, then the task appears under Due Today (or its time bucket). (refs §6)
- **AC-TASK-38** Given a pending biweekly task due next week, when the dashboard widget loads, then it does not appear. (refs §6)
- **AC-TASK-39** Given an X Times Total task with `completed_count` 2, when the user changes its pattern to Weekly in the edit dialog and saves, then `completed_count` is still 2 and `occurrences` is unchanged. (refs §7)

## 9. Discrepancies & open questions

- **D-470** Weekly: the Tasks page's next occurrence honours `days_of_week` (next chosen weekday within 7 days, else +7) (`src/pages/Tasks.jsx:270-285`); the show-today rule for `weekly` compares only the `due_date`'s weekday with today's and ignores `days_of_week` (`src/lib/recurringTaskUtils.js:20-28`).
- **D-471** Biweekly and Specific Days: the Tasks page creates next occurrences for `biweekly` (+14) and `days_of_week` (next chosen weekday, else +1) (`src/pages/Tasks.jsx:286-303`); the show-today rule returns "do not show" for both patterns unless the task is already due or overdue (`src/lib/recurringTaskUtils.js:43`).
- **D-472** Monthly: the Tasks page's next occurrence is the due date with the month advanced (`src/pages/Tasks.jsx:304`); the show-today rule shows a monthly task whenever today's day-of-month matches the `due_date` (or, without one, `last_completed_date`) regardless of month (`src/lib/recurringTaskUtils.js:30-41`).
- **D-473** The manual lists Daily, Weekly (with days), Monthly (`src/pages/UserManual.jsx:118`); the create dialog offers One-time, Daily, Weekly, Biweekly (Every 2 Weeks), Monthly, Specific Days of Week, X Times Total (`src/pages/Tasks.jsx:467-473`).
- **D-474** The Sort = Frequency heading for `days_of_week` reads "Specific Days" (`src/pages/Tasks.jsx:624,751`), the selects read "Specific Days of Week" (`src/pages/Tasks.jsx:472`, `src/components/TaskEditDialog.jsx:216`), and the print line reads "↻ days of week" (`src/components/PrintFormatTasks.jsx:65`); likewise "X Times Total" versus "↻ occurrences".
- **D-475** "Today" for the completed-this-period helper and the Tasks page is the hand-built local date (`src/pages/Tasks.jsx:44`), the base date for the next occurrence is parsed from the stored string and written back via the UTC date string (`src/pages/Tasks.jsx:268,315`), and the show-today rule parses `due_date` with `new Date(<string>)` before reading the local weekday (`src/lib/recurringTaskUtils.js:24,33`). (Companion to spec.md D-451.)
- **D-476** The sibling check (`src/pages/Tasks.jsx:260-265`) and the deduplication key (`src/pages/Tasks.jsx:99`) both identify a recurring series by title + pattern, while the Google import identifies a task by `google_task_id` (`base44/functions/syncGoogleTasks/entry.ts:52-56`); a Google-imported task and a locally created recurring task with the same title and pattern are one series to the former and two records to the latter.
- **Q-455** Blocks: §4. Question: which view, if any, is the "completed this period" helper (`src/pages/Tasks.jsx:145-165`) meant to drive?
- **Q-456** Blocks: §3. Question: is the sibling check intended to match on title and pattern only, so that two distinct recurring tasks sharing a title suppress each other's next occurrence (`src/pages/Tasks.jsx:260-267`)?
- **Q-457** Blocks: §6. Question: is the dashboard widget meant to surface `biweekly` and `days_of_week` tasks on their scheduled days (D-471)?
