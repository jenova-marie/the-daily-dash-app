# Milestone Tasks — Feature Spec

**Feature code:** `GOAL` (IDs use `GOAL-T`) · **Level:** 2 (sub-spec of `20-features/goals/spec.md`) · **Status:** draft

**Tag summary:** Implemented 38 · Described 1 · Partial 0

**Sources owned:** `src/pages/Goals.jsx` (milestone task functions and expanded-row markup: lines 101-178, 417-505, 268-272), `base44/entities/GoalTask.jsonc` (product role)
**Sources referenced (owned elsewhere):** `src/pages/DailySchedule.jsx:239,1044-1107` → `20-features/daily-schedule/item-library.md` · `src/components/DailyToDo.jsx:99,108,127-128,192` → `20-features/daily-schedule/daily-todo.md` · `base44/functions/deleteToDoItem/entry.ts:83-97` → `10-architecture/schedule-hub.md` · `src/components/visionboard/PillarManager.jsx:230-237`, `DailyEvaluation.jsx:38-59,171-180` → `20-features/vision-board` · `src/components/dashboard/DashboardGoals.jsx:110-116` → `spec.md` §4

**Permissions:** per-user data; admin-only operations: none

## 0. Entry points & navigation

- The expanded goal row on the Goals page (`spec.md` §4 "Expanded row") `[Implemented]` `src/pages/Goals.jsx:417-505`.
- The "Milestones (Tasks)" list in the "New Goal" dialog `[Implemented]` `src/pages/Goals.jsx:613-629`.
- Read elsewhere: the Daily Schedule item library "Goals" tab, the daily to-do, and the daily evaluation (§7).

## 1. Purpose & user benefit

A milestone task is one step toward a goal. Ticking steps off is the only way progress moves on the Goals page: the goal's percentage, status, archive flag, and start/completion stamps are all derived from its milestone tasks. A milestone task can require several completions, tracked as a count.

User Manual (`spec.md` §1) `[Described]` `src/pages/UserManual.jsx:292-298`: "Add milestone tasks within a goal … Mark milestones complete to track incremental progress toward the overall goal." Walkthrough step 2 `[Implemented]` `src/components/onboarding/GoalsOnboarding.jsx:16-18`: "Break each goal into actionable milestone tasks. Check them off as you complete them — the goal's progress bar updates automatically."

## 2. Concepts & vocabulary

Glossary terms used: **milestone task**, **goal**, **occurrence**, **frequency**, **archive**.

Feature-local terms:
- **single-occurrence task** — a milestone task whose `occurrences` is absent or 1; completion is a boolean `[Implemented]` `src/pages/Goals.jsx:123-131`.
- **multi-occurrence task** — `occurrences` above 1; completion is a count `completed_count` reaching `occurrences` `[Implemented]` `src/pages/Goals.jsx:124-128`.
- **derivation** — the recomputation of the parent goal after any milestone change `[Implemented]` `src/pages/Goals.jsx:167-178`.

## 3. User stories

- **US-GOAL-T01** As the account owner, I want to list a goal's first steps while creating it so that the goal starts with a plan. `[Implemented]` `src/pages/Goals.jsx:251-258,268-272`
- **US-GOAL-T02** As the account owner, I want to add a step that must be done several times so that "run 3 times" is one task with a counter. `[Implemented]` `src/pages/Goals.jsx:111-120,488-501`
- **US-GOAL-T03** As the account owner, I want ticking a step to move the goal's progress, start it, and complete it automatically so that status is always true to the work. `[Implemented]` `src/pages/Goals.jsx:122-134,167-178`
- **US-GOAL-T04** As the account owner, I want to rename a step or change its count in place so that fixing a plan is quick. `[Implemented]` `src/pages/Goals.jsx:136-159,426-473`
- **US-GOAL-T05** As the account owner, I want my next step for each goal offered on the Daily Schedule so that goals get time on the clock. `[Implemented]` `20-features/daily-schedule/item-library.md` BR-SCHED-68

## 4. Capabilities & interactions

- **Create with the goal.** Each pending line in the "New Goal" dialog becomes a milestone task with `frequency: "once"`, `completed: false`, and no explicit occurrence count (entity default 1) `[Implemented]` `src/pages/Goals.jsx:268-272`.
- **Create inline.** In an expanded row, the "Add a task..." input plus the occurrence stepper and the "Add task" button create a milestone task with `frequency: "once"`, `completed: false`, `occurrences` = the stepper value (integer, minimum 1, default 1), `completed_count: 0`; the input and stepper reset; the goal is recomputed `[Implemented]` `src/pages/Goals.jsx:111-120,480-503`. An empty or whitespace title is ignored `[Implemented]` `src/pages/Goals.jsx:112-113`.
- **Toggle.** Checkbox per task (BR-GOAL-T03); the goal is recomputed after every toggle `[Implemented]` `src/pages/Goals.jsx:122-134,425`.
- **Rename.** Double-click the title; Enter or blur saves the trimmed value; an empty value cancels; Escape cancels; the goal is recomputed `[Implemented]` `src/pages/Goals.jsx:136-142,154-158,426-441`.
- **Change occurrences.** Double-click the badge ("{count}/{occurrences}" or "×1"); a pill with "−", the value, "+", "✓" appears; "−" stops at 1; "✓" saves (BR-GOAL-T04) and the goal is recomputed `[Implemented]` `src/pages/Goals.jsx:143-158,442-473`.
- **Delete.** Hover "X" deletes without confirmation; the goal is recomputed `[Implemented]` `src/pages/Goals.jsx:161-165,474-476`.
- **Display.** Completed tasks are struck through; the badge shows the count for multi-occurrence tasks and "×1" on hover otherwise `[Implemented]` `src/pages/Goals.jsx:436-455`.

### 4a. Keyboard & pointer

See `spec.md` §4a (Enter, Escape, blur, double-click, hover; pill buttons act on mouse-down).

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| New-task title per goal | text | "" | memory `src/pages/Goals.jsx:48` |
| New-task occurrences per goal | ≥ 1 | 1 | memory `:49` |
| Editing task | `{ taskId, field: title\|occurrences, value }` | none | memory `:50` |
| Pending milestone lines (create dialog) | list of strings | empty | memory `:56-57` |

### 4c. Empty & fallback states

- Goal with no milestone tasks: "No tasks yet" on the row (`spec.md` §4c) `[Implemented]` `src/pages/Goals.jsx:384`.
- Goal with no milestone tasks is not recomputed: the derivation returns early, so its progress and status stay as last written `[Implemented]` `src/pages/Goals.jsx:168-169`.

## 5. Business rules

- **BR-GOAL-T01 (creation shape).** Milestone tasks created on the Goals page always have `frequency: "once"`; the frequency select declared by the entity (`once`, `daily`, `weekly`, `biweekly`, `monthly`) is not offered here `[Implemented]` `src/pages/Goals.jsx:115,270`, `base44/entities/GoalTask.jsonc:11-20` (D-611).
- **BR-GOAL-T02 (occurrence minimum).** `occurrences` is an integer of at least 1; non-numbers become 1 `[Implemented]` `src/pages/Goals.jsx:114,144,492,498`.
- **BR-GOAL-T03 (toggle).** Single-occurrence: `completed` flips. Multi-occurrence: when the task is not completed, `completed_count` increases by 1 up to `occurrences`; when completed, it decreases by 1 down to 0; `completed` becomes `completed_count >= occurrences` `[Implemented]` `src/pages/Goals.jsx:122-131`.
- **BR-GOAL-T04 (occurrence clamp).** When `occurrences` is edited to N, `completed_count` is clamped to at most N and `completed` is recomputed as `completed_count >= N`; so lowering N to the current count completes the task and raising N above the count un-completes it `[Implemented]` `src/pages/Goals.jsx:143-152`.
- **BR-GOAL-T05 (derivation).** After every milestone create, toggle, rename, occurrence edit, or delete, the parent goal is recomputed from all its milestone tasks: `progress` = round(completed ÷ total × 100); `status` = `completed` at 100, `in_progress` above 0, else `not_started`; `archived` = (status is `completed`); `started_at` = now when moving from `not_started` to `in_progress`; `completed_at` = now when moving into `completed` from any other status. A goal with no milestone tasks is left untouched `[Implemented]` `src/pages/Goals.jsx:167-178`.
- **BR-GOAL-T06 (completion auto-archives).** Because `archived` follows the derived status, completing the last milestone task moves the goal to the Archive view; un-completing one brings it back to Active `[Implemented]` `src/pages/Goals.jsx:173,219-221`.
- **BR-GOAL-T07 (restore does not touch tasks).** Restoring a goal writes `archived: false, status: "in_progress"` and changes no milestone task; the next milestone change re-derives the status, which returns to `completed` and re-archives the goal if all tasks are still complete `[Implemented]` `src/pages/Goals.jsx:229-232,167-178`.
- **BR-GOAL-T08 (dashboard complete bypasses tasks).** The Dashboard "✓" writes the goal completed without changing milestone tasks (`spec.md` BR-GOAL-15); the next milestone change re-derives from the tasks `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:110-116`, `src/pages/Goals.jsx:167-178`.
- **BR-GOAL-T09 (orphans on goal delete).** Deleting a goal does not delete its milestone tasks `[Implemented]` `src/pages/Goals.jsx:281-284`.
- **BR-GOAL-T10 (rename requires text).** A rename that trims to empty is discarded `[Implemented]` `src/pages/Goals.jsx:140-141`.
- **BR-GOAL-T11 (load).** The page loads the 500 newest milestone tasks and groups them by `goal_id`; derivation re-reads a goal's tasks by filter `[Implemented]` `src/pages/Goals.jsx:101-109,168`.

### 5a. State & lifecycle

`GoalTask.completed` / `completed_count`:

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| created (`completed` false, count 0) | add inline / with goal | same | derivation (inline only) `src/pages/Goals.jsx:115-119,268-272` |
| single, not completed | checkbox | completed | derivation `:130-133` |
| single, completed | checkbox | not completed | derivation `:130-133` |
| multi, count c < N | checkbox | count c+1; completed when c+1 ≥ N | derivation `:124-128` |
| multi, completed (count N) | checkbox | count N−1, not completed | derivation `:124-128` |
| any | occurrences edited to N | count min(count, N); completed = count ≥ N | derivation `:143-152` |
| any | rename | title changed | derivation `:139-142,154-158` |
| any | "X" | removed | derivation `:161-165` |
| any | to-do `delete_app` on a goal-sourced row | removed | `src/components/DailyToDo.jsx:192`, `base44/functions/deleteToDoItem/entry.ts:97` |

Parent goal transitions driven by the derivation: `spec.md` §5a.

Tabs on the Goals page: Active = goal not archived and not `completed`; Archive = archived or `completed`; the derivation keeps `archived` equal to "all milestone tasks complete" `[Implemented]` `src/pages/Goals.jsx:173,219-222`.

### 5b. Time & date semantics

- `started_at` / `completed_at` on the goal are `toISOString()` timestamps taken at derivation time (AR-TIME-12) `[Implemented]` `src/pages/Goals.jsx:174-175`.
- Milestone tasks carry no dates; the declared `frequency` is never used for scheduling on this page `[Implemented]` `src/pages/Goals.jsx:115,270`.

## 6. Data

Entity `GoalTask` (E-GoalTask): `goal_id`, `title`, `frequency`, `completed`, `occurrences` (default 1), `completed_count` (default 0) `[Implemented]` `base44/entities/GoalTask.jsonc:1-55`. Full sheet: `10-architecture/data-model/goals.md`.

| Operation | Citation |
|---|---|
| `list("-created_date", 500)` | `src/pages/Goals.jsx:102` |
| `filter({ goal_id })` (derivation) | `src/pages/Goals.jsx:168` |
| `create` (with goal; inline) | `src/pages/Goals.jsx:270,115` |
| `update` (`completed`, `completed_count`, `title`, `occurrences`) | `src/pages/Goals.jsx:128,130,154` |
| `delete` | `src/pages/Goals.jsx:162` |
| `Goal.update` (derived fields) | `src/pages/Goals.jsx:176` |

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| outbound | Daily Schedule — item library "Goals" tab | milestone tasks not completed, oldest first; the first one with no goal-sourced schedule item on the selected date is offered per goal; adding it creates a `ScheduleItem` with `source_type: "goal"` and `source_id` = the milestone task id; nothing is written on the task | `20-features/daily-schedule/item-library.md` BR-SCHED-68, BR-SCHED-69, BR-SCHED-78 |
| outbound | Daily Schedule page | subscribes to `GoalTask` changes (500 ms debounce) and removes orphaned schedule items on delete | `10-architecture/schedule-hub.md` AR-HUB-36 |
| outbound | Daily to-do | goal-sourced rows subscribe to `GoalTask`; completion of goal rows returns before any write (D-205 / Q-404 in `10-architecture/schedule-hub.md`); `delete_app` deletes the milestone task | `src/components/DailyToDo.jsx:99,108,127-128,192` |
| outbound | Backend `deleteToDoItem` | `delete_app` with `sourceType: "goal"` deletes the `GoalTask` after ownership checks | `base44/functions/deleteToDoItem/entry.ts:83-97` |
| inbound | Vision Board — pillar card | bulk-creates N milestone tasks titled "{activity} (i/N)" under a new goal | `src/components/visionboard/PillarManager.jsx:230-237` |
| inbound | Vision Board — daily evaluation | creates milestone tasks under goals made from queued activities; shows "remaining" = incomplete task count for open goals matched by title | `src/components/visionboard/DailyEvaluation.jsx:38-59,171-180` |
| outbound | Dashboard "Goals Overview" | reads only the goal's derived `progress`; no task access | `src/components/dashboard/DashboardGoals.jsx:60-61` |

The derivation runs only on the Goals page; milestone changes made from the to-do or the vision board do not recompute the goal until the Goals page next changes a task of that goal `[Implemented]` `src/pages/Goals.jsx:167-178`, `src/components/DailyToDo.jsx:127-128,192`.

### 7a. Feedback & notifications

None. Milestone deletes do not confirm `[Implemented]` `src/pages/Goals.jsx:474-476`.

## 8. AI & automation

None.

## 9. Onboarding content

Step 2 of the Goals walkthrough (`spec.md` §9).

## 10. Device-local preferences

None.

## 11. Seed / hardcoded data used

- `frequency: "once"` on every task created here `src/pages/Goals.jsx:115,270`.
- Occurrence minimum 1 `src/pages/Goals.jsx:114,144,460,492`.
- Load limit 500 `src/pages/Goals.jsx:102`.

## 12. Print / email formats

None of their own; card prints include the expanded rows' markup (`spec.md` §12).

## 13. Acceptance criteria

- **AC-GOAL-T01** Given a goal with two milestone tasks, When one is ticked, Then the goal reads "50% • 1/2 tasks", status `in_progress`, `started_at` set. (refs BR-GOAL-T03, BR-GOAL-T05)
- **AC-GOAL-T02** Given the same goal, When the second is ticked, Then progress is 100, status `completed`, `archived` true, `completed_at` set, and the goal appears under Archive. (refs BR-GOAL-T05, BR-GOAL-T06)
- **AC-GOAL-T03** Given a completed goal, When a milestone task is un-ticked, Then status is `in_progress`, `archived` false, and the goal returns to Active; `completed_at` keeps its old value. (refs BR-GOAL-T05, BR-GOAL-T06)
- **AC-GOAL-T04** Given a task with occurrences 3 and count 0, When ticked three times, Then the count reads 1/3, 2/3, then 3/3 with the task completed; When ticked a fourth time, Then the count is 2/3 and the task is not completed. (refs BR-GOAL-T03)
- **AC-GOAL-T05** Given a task with occurrences 5 and count 3, When occurrences is set to 2 via the pill, Then count becomes 2 and the task is completed; When set to 4, Then count stays 2 and the task is not completed. (refs BR-GOAL-T04)
- **AC-GOAL-T06** Given a task title is renamed to spaces only, When Enter is pressed, Then the original title remains. (refs BR-GOAL-T10)
- **AC-GOAL-T07** Given a goal is deleted, Then its milestone tasks still exist. (refs BR-GOAL-T09)
- **AC-GOAL-T08** Given an archived goal with all tasks complete is restored, Then it is `in_progress` and active; When any of its tasks is toggled twice, Then it is `completed` and archived again. (refs BR-GOAL-T07)
- **AC-GOAL-T09** Given the "Add a task..." input is empty, When "Add task" is pressed, Then nothing is created. (refs §4)
- **AC-GOAL-T10** Given a goal whose only milestone task is deleted, Then the goal's progress and status are unchanged from before the delete. (refs §4c, BR-GOAL-T05)

## 14. Discrepancies & open questions

- **D-611** (milestone frequency and reset; recorded in `spec.md` §14) applies here.
- **D-004**, **D-205**, **Q-404** apply and are recorded in `10-architecture/data-model/goals.md` and `10-architecture/schedule-hub.md`.
- **Q-601**, **Q-602** are recorded in `spec.md` §14.
- No further discrepancies or questions.
